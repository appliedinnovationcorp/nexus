# 🏗️ Terraform Infrastructure as Code

Terraform configurations for provisioning and managing cloud infrastructure across AWS, Azure, and GCP.

## 📁 Structure

```
terraform/
├── modules/              # Reusable Terraform modules
│   ├── vpc/             # Virtual Private Cloud
│   ├── eks/             # Elastic Kubernetes Service
│   ├── rds/             # Relational Database Service
│   ├── s3/              # Object Storage
│   ├── iam/             # Identity and Access Management
│   └── monitoring/      # Monitoring and logging
├── environments/        # Environment-specific configurations
│   ├── development/     # Development environment
│   ├── staging/         # Staging environment
│   └── production/      # Production environment
├── providers/           # Cloud provider configurations
│   ├── aws/             # Amazon Web Services
│   ├── azure/           # Microsoft Azure
│   └── gcp/             # Google Cloud Platform
└── state/               # Terraform state management
    ├── backend.tf       # Remote state configuration
    └── versions.tf      # Provider version constraints
```

## 🚀 Usage

### Initialize Environment
```bash
cd environments/staging
terraform init
terraform plan
terraform apply
```

### Multi-Cloud Deployment
```bash
# Deploy to AWS
cd providers/aws
terraform apply

# Deploy to Azure
cd providers/azure
terraform apply

# Deploy to GCP
cd providers/gcp
terraform apply
```

## ☁️ Supported Providers

- **AWS**: EKS, RDS, S3, CloudFront, Route53
- **Azure**: AKS, Azure Database, Blob Storage, CDN
- **GCP**: GKE, Cloud SQL, Cloud Storage, Cloud CDN
