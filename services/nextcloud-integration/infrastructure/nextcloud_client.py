"""
Nextcloud API Client Implementation
"""
import aiohttp
import asyncio
import json
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Optional
from datetime import datetime
import base64
import hashlib
from urllib.parse import quote
from ..domain.repositories import NextcloudAPIRepository


class NextcloudAPIClient(NextcloudAPIRepository):
    """Nextcloud WebDAV and OCS API client implementation"""
    
    def __init__(self, base_url: str, username: str, password: str):
        self.base_url = base_url.rstrip('/')
        self.username = username
        self.password = password
        self.auth = aiohttp.BasicAuth(username, password)
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(auth=self.auth)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def _get_webdav_url(self, path: str) -> str:
        """Get WebDAV URL for file operations"""
        return f"{self.base_url}/remote.php/dav/files/{self.username}/{path.lstrip('/')}"
    
    def _get_ocs_url(self, endpoint: str) -> str:
        """Get OCS API URL"""
        return f"{self.base_url}/ocs/v2.php/{endpoint.lstrip('/')}"
    
    async def _ensure_session(self):
        """Ensure session is available"""
        if not self.session:
            self.session = aiohttp.ClientSession(auth=self.auth)
    
    async def upload_file(
        self,
        file_path: str,
        content: bytes,
        client_id: str,
        project_id: str = None
    ) -> Dict[str, Any]:
        """Upload file to Nextcloud"""
        await self._ensure_session()
        
        # Construct the full path
        if project_id:
            full_path = f"clients/{client_id}/projects/{project_id}/{file_path}"
        else:
            full_path = f"clients/{client_id}/{file_path}"
        
        # Ensure directory exists
        await self._ensure_directory_exists(f"clients/{client_id}")
        if project_id:
            await self._ensure_directory_exists(f"clients/{client_id}/projects/{project_id}")
        
        url = self._get_webdav_url(full_path)
        
        try:
            async with self.session.put(url, data=content) as response:
                if response.status in [201, 204]:
                    # Get file info after upload
                    file_info = await self.get_file_info(full_path)
                    return {
                        'success': True,
                        'file_path': full_path,
                        'file_id': file_info.get('file_id'),
                        'size': len(content),
                        'etag': response.headers.get('ETag', '').strip('"')
                    }
                else:
                    error_text = await response.text()
                    return {
                        'success': False,
                        'error': f"Upload failed: {response.status} - {error_text}"
                    }
        except Exception as e:
            return {
                'success': False,
                'error': f"Upload error: {str(e)}"
            }
    
    async def download_file(self, file_path: str) -> bytes:
        """Download file from Nextcloud"""
        await self._ensure_session()
        
        url = self._get_webdav_url(file_path)
        
        async with self.session.get(url) as response:
            if response.status == 200:
                return await response.read()
            else:
                raise Exception(f"Download failed: {response.status}")
    
    async def delete_file(self, file_path: str) -> bool:
        """Delete file from Nextcloud"""
        await self._ensure_session()
        
        url = self._get_webdav_url(file_path)
        
        async with self.session.delete(url) as response:
            return response.status == 204
    
    async def create_folder(self, folder_path: str) -> Dict[str, Any]:
        """Create folder in Nextcloud"""
        await self._ensure_session()
        
        url = self._get_webdav_url(folder_path)
        
        headers = {'Content-Type': 'application/xml'}
        
        async with self.session.request('MKCOL', url, headers=headers) as response:
            if response.status == 201:
                return {
                    'success': True,
                    'folder_path': folder_path
                }
            elif response.status == 405:  # Method not allowed - folder exists
                return {
                    'success': True,
                    'folder_path': folder_path,
                    'already_exists': True
                }
            else:
                error_text = await response.text()
                return {
                    'success': False,
                    'error': f"Folder creation failed: {response.status} - {error_text}"
                }
    
    async def list_folder_contents(self, folder_path: str) -> List[Dict[str, Any]]:
        """List contents of a folder"""
        await self._ensure_session()
        
        url = self._get_webdav_url(folder_path)
        
        # PROPFIND request to list folder contents
        propfind_body = '''<?xml version="1.0"?>
        <d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
            <d:prop>
                <d:displayname />
                <d:getcontentlength />
                <d:getcontenttype />
                <d:getetag />
                <d:getlastmodified />
                <d:resourcetype />
                <oc:fileid />
                <oc:size />
            </d:prop>
        </d:propfind>'''
        
        headers = {
            'Content-Type': 'application/xml',
            'Depth': '1'
        }
        
        async with self.session.request('PROPFIND', url, data=propfind_body, headers=headers) as response:
            if response.status == 207:  # Multi-Status
                xml_content = await response.text()
                return self._parse_propfind_response(xml_content, folder_path)
            else:
                raise Exception(f"List folder failed: {response.status}")
    
    async def create_share(
        self,
        file_path: str,
        share_type: int,
        share_with: str = None,
        permissions: int = 1,
        password: str = None,
        expire_date: str = None
    ) -> Dict[str, Any]:
        """Create file/folder share using OCS API"""
        await self._ensure_session()
        
        url = self._get_ocs_url('apps/files_sharing/api/v1/shares')
        
        data = {
            'path': f'/{file_path}',
            'shareType': share_type,
            'permissions': permissions
        }
        
        if share_with:
            data['shareWith'] = share_with
        if password:
            data['password'] = password
        if expire_date:
            data['expireDate'] = expire_date
        
        headers = {
            'OCS-APIRequest': 'true',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        async with self.session.post(url, data=data, headers=headers) as response:
            if response.status == 200:
                xml_content = await response.text()
                return self._parse_ocs_response(xml_content)
            else:
                error_text = await response.text()
                return {
                    'success': False,
                    'error': f"Share creation failed: {response.status} - {error_text}"
                }
    
    async def update_share(
        self,
        share_id: str,
        permissions: int = None,
        password: str = None,
        expire_date: str = None
    ) -> Dict[str, Any]:
        """Update existing share"""
        await self._ensure_session()
        
        url = self._get_ocs_url(f'apps/files_sharing/api/v1/shares/{share_id}')
        
        data = {}
        if permissions is not None:
            data['permissions'] = permissions
        if password is not None:
            data['password'] = password
        if expire_date is not None:
            data['expireDate'] = expire_date
        
        headers = {
            'OCS-APIRequest': 'true',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        async with self.session.put(url, data=data, headers=headers) as response:
            if response.status == 200:
                xml_content = await response.text()
                return self._parse_ocs_response(xml_content)
            else:
                error_text = await response.text()
                return {
                    'success': False,
                    'error': f"Share update failed: {response.status} - {error_text}"
                }
    
    async def delete_share(self, share_id: str) -> bool:
        """Delete share"""
        await self._ensure_session()
        
        url = self._get_ocs_url(f'apps/files_sharing/api/v1/shares/{share_id}')
        
        headers = {'OCS-APIRequest': 'true'}
        
        async with self.session.delete(url, headers=headers) as response:
            return response.status == 200
    
    async def get_file_info(self, file_path: str) -> Dict[str, Any]:
        """Get file information and metadata"""
        await self._ensure_session()
        
        url = self._get_webdav_url(file_path)
        
        propfind_body = '''<?xml version="1.0"?>
        <d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
            <d:prop>
                <d:displayname />
                <d:getcontentlength />
                <d:getcontenttype />
                <d:getetag />
                <d:getlastmodified />
                <d:resourcetype />
                <oc:fileid />
                <oc:size />
                <oc:checksums />
            </d:prop>
        </d:propfind>'''
        
        headers = {
            'Content-Type': 'application/xml',
            'Depth': '0'
        }
        
        async with self.session.request('PROPFIND', url, data=propfind_body, headers=headers) as response:
            if response.status == 207:
                xml_content = await response.text()
                results = self._parse_propfind_response(xml_content, file_path)
                return results[0] if results else {}
            else:
                raise Exception(f"Get file info failed: {response.status}")
    
    async def get_file_versions(self, file_path: str) -> List[Dict[str, Any]]:
        """Get file version history"""
        await self._ensure_session()
        
        # Get file info first to get file ID
        file_info = await self.get_file_info(file_path)
        file_id = file_info.get('file_id')
        
        if not file_id:
            return []
        
        url = self._get_webdav_url(f'meta/{file_id}/v')
        
        propfind_body = '''<?xml version="1.0"?>
        <d:propfind xmlns:d="DAV:" xmlns:oc="http://owncloud.org/ns">
            <d:prop>
                <d:getcontentlength />
                <d:getlastmodified />
                <oc:size />
            </d:prop>
        </d:propfind>'''
        
        headers = {
            'Content-Type': 'application/xml',
            'Depth': '1'
        }
        
        try:
            async with self.session.request('PROPFIND', url, data=propfind_body, headers=headers) as response:
                if response.status == 207:
                    xml_content = await response.text()
                    return self._parse_versions_response(xml_content)
                else:
                    return []
        except:
            return []
    
    async def restore_file_version(self, file_path: str, version_id: str) -> bool:
        """Restore specific file version"""
        await self._ensure_session()
        
        # This would require more complex implementation
        # For now, return False as not implemented
        return False
    
    async def create_user(
        self,
        user_id: str,
        password: str,
        display_name: str = None,
        email: str = None,
        groups: List[str] = None
    ) -> Dict[str, Any]:
        """Create Nextcloud user"""
        await self._ensure_session()
        
        url = self._get_ocs_url('cloud/users')
        
        data = {
            'userid': user_id,
            'password': password
        }
        
        if display_name:
            data['displayName'] = display_name
        if email:
            data['email'] = email
        if groups:
            data['groups'] = groups
        
        headers = {
            'OCS-APIRequest': 'true',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        async with self.session.post(url, data=data, headers=headers) as response:
            if response.status == 200:
                xml_content = await response.text()
                return self._parse_ocs_response(xml_content)
            else:
                error_text = await response.text()
                return {
                    'success': False,
                    'error': f"User creation failed: {response.status} - {error_text}"
                }
    
    async def create_group(self, group_id: str) -> Dict[str, Any]:
        """Create Nextcloud group"""
        await self._ensure_session()
        
        url = self._get_ocs_url('cloud/groups')
        
        data = {'groupid': group_id}
        
        headers = {
            'OCS-APIRequest': 'true',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        async with self.session.post(url, data=data, headers=headers) as response:
            if response.status == 200:
                xml_content = await response.text()
                return self._parse_ocs_response(xml_content)
            else:
                error_text = await response.text()
                return {
                    'success': False,
                    'error': f"Group creation failed: {response.status} - {error_text}"
                }
    
    async def add_user_to_group(self, user_id: str, group_id: str) -> bool:
        """Add user to group"""
        await self._ensure_session()
        
        url = self._get_ocs_url(f'cloud/users/{user_id}/groups')
        
        data = {'groupid': group_id}
        
        headers = {
            'OCS-APIRequest': 'true',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        async with self.session.post(url, data=data, headers=headers) as response:
            return response.status == 200
    
    async def set_user_quota(self, user_id: str, quota: str) -> bool:
        """Set user storage quota"""
        await self._ensure_session()
        
        url = self._get_ocs_url(f'cloud/users/{user_id}')
        
        data = {'key': 'quota', 'value': quota}
        
        headers = {
            'OCS-APIRequest': 'true',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        async with self.session.put(url, data=data, headers=headers) as response:
            return response.status == 200
    
    async def _ensure_directory_exists(self, directory_path: str):
        """Ensure directory exists, create if not"""
        parts = directory_path.strip('/').split('/')
        current_path = ''
        
        for part in parts:
            current_path = f"{current_path}/{part}" if current_path else part
            await self.create_folder(current_path)
    
    def _parse_propfind_response(self, xml_content: str, base_path: str) -> List[Dict[str, Any]]:
        """Parse PROPFIND XML response"""
        try:
            root = ET.fromstring(xml_content)
            results = []
            
            # Define namespaces
            namespaces = {
                'd': 'DAV:',
                'oc': 'http://owncloud.org/ns'
            }
            
            for response in root.findall('.//d:response', namespaces):
                href = response.find('d:href', namespaces)
                if href is None:
                    continue
                
                path = href.text
                if path == f"/remote.php/dav/files/{self.username}/{base_path}/":
                    continue  # Skip the folder itself
                
                propstat = response.find('d:propstat', namespaces)
                if propstat is None:
                    continue
                
                prop = propstat.find('d:prop', namespaces)
                if prop is None:
                    continue
                
                # Extract properties
                item = {
                    'path': path,
                    'name': self._get_text(prop.find('d:displayname', namespaces)),
                    'size': self._get_int(prop.find('d:getcontentlength', namespaces)),
                    'content_type': self._get_text(prop.find('d:getcontenttype', namespaces)),
                    'etag': self._get_text(prop.find('d:getetag', namespaces)),
                    'last_modified': self._get_text(prop.find('d:getlastmodified', namespaces)),
                    'file_id': self._get_text(prop.find('oc:fileid', namespaces)),
                    'is_directory': prop.find('d:resourcetype/d:collection', namespaces) is not None
                }
                
                results.append(item)
            
            return results
        except ET.ParseError:
            return []
    
    def _parse_ocs_response(self, xml_content: str) -> Dict[str, Any]:
        """Parse OCS API XML response"""
        try:
            root = ET.fromstring(xml_content)
            
            meta = root.find('.//meta')
            if meta is not None:
                status = meta.find('status')
                statuscode = meta.find('statuscode')
                message = meta.find('message')
                
                result = {
                    'success': status.text == 'ok' if status is not None else False,
                    'status_code': int(statuscode.text) if statuscode is not None else 0,
                    'message': message.text if message is not None else ''
                }
                
                # Extract data if present
                data = root.find('.//data')
                if data is not None:
                    result['data'] = self._xml_to_dict(data)
                
                return result
            
            return {'success': False, 'message': 'Invalid response format'}
        except ET.ParseError:
            return {'success': False, 'message': 'Failed to parse response'}
    
    def _parse_versions_response(self, xml_content: str) -> List[Dict[str, Any]]:
        """Parse file versions response"""
        try:
            root = ET.fromstring(xml_content)
            versions = []
            
            namespaces = {
                'd': 'DAV:',
                'oc': 'http://owncloud.org/ns'
            }
            
            for response in root.findall('.//d:response', namespaces):
                href = response.find('d:href', namespaces)
                if href is None:
                    continue
                
                propstat = response.find('d:propstat', namespaces)
                if propstat is None:
                    continue
                
                prop = propstat.find('d:prop', namespaces)
                if prop is None:
                    continue
                
                version = {
                    'path': href.text,
                    'size': self._get_int(prop.find('d:getcontentlength', namespaces)),
                    'last_modified': self._get_text(prop.find('d:getlastmodified', namespaces))
                }
                
                versions.append(version)
            
            return versions
        except ET.ParseError:
            return []
    
    def _xml_to_dict(self, element) -> Dict[str, Any]:
        """Convert XML element to dictionary"""
        result = {}
        for child in element:
            if len(child) == 0:
                result[child.tag] = child.text
            else:
                result[child.tag] = self._xml_to_dict(child)
        return result
    
    def _get_text(self, element) -> Optional[str]:
        """Safely get text from XML element"""
        return element.text if element is not None else None
    
    def _get_int(self, element) -> Optional[int]:
        """Safely get integer from XML element"""
        if element is not None and element.text:
            try:
                return int(element.text)
            except ValueError:
                pass
        return None
