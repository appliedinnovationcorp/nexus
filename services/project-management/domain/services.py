"""
Project Management Domain Services
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import numpy as np
from shared.domain import DomainService, Specification
from .models import Project, Task, ProjectRisk, RiskLevel, Priority, TaskStatus, ProjectStatus
from .repositories import ProjectRepository


class ProjectRiskAssessmentService(DomainService):
    """Service for assessing project risks using AI/ML"""
    
    def assess_project_risk(self, project: Project) -> float:
        """Calculate overall project risk score (0-1, where 1 is highest risk)"""
        risk_factors = []
        
        # Schedule risk
        schedule_risk = self._calculate_schedule_risk(project)
        risk_factors.append(schedule_risk * 0.3)  # 30% weight
        
        # Budget risk
        budget_risk = self._calculate_budget_risk(project)
        risk_factors.append(budget_risk * 0.2)  # 20% weight
        
        # Team risk
        team_risk = self._calculate_team_risk(project)
        risk_factors.append(team_risk * 0.2)  # 20% weight
        
        # Complexity risk
        complexity_risk = self._calculate_complexity_risk(project)
        risk_factors.append(complexity_risk * 0.15)  # 15% weight
        
        # External risk
        external_risk = self._calculate_external_risk(project)
        risk_factors.append(external_risk * 0.15)  # 15% weight
        
        return min(sum(risk_factors), 1.0)
    
    def _calculate_schedule_risk(self, project: Project) -> float:
        """Calculate schedule-related risk"""
        metrics = project.calculate_metrics()
        
        # Check if project is behind schedule
        days_elapsed = (datetime.utcnow() - project.time_range.start_date).days
        total_days = project.time_range.duration_days
        expected_completion = days_elapsed / total_days if total_days > 0 else 0
        
        schedule_variance = expected_completion - (metrics.completion_percentage / 100)
        
        # Normalize to 0-1 scale
        return max(0, min(schedule_variance * 2, 1.0))
    
    def _calculate_budget_risk(self, project: Project) -> float:
        """Calculate budget-related risk"""
        metrics = project.calculate_metrics()
        
        # Simple budget utilization risk (would be more sophisticated in real implementation)
        if project.budget.amount == 0:
            return 0.5  # Medium risk if no budget defined
        
        budget_utilization = metrics.budget_utilized.amount / project.budget.amount
        
        # High risk if over budget or burning through budget too quickly
        if budget_utilization > 1.0:
            return 1.0
        elif budget_utilization > 0.8:
            return 0.7
        elif budget_utilization > 0.6:
            return 0.4
        else:
            return 0.2
    
    def _calculate_team_risk(self, project: Project) -> float:
        """Calculate team-related risk"""
        # Check for team size and task distribution
        team_size = len(project.team_members)
        total_tasks = len(project.tasks)
        
        if team_size == 0:
            return 1.0  # High risk with no team
        
        # Check task distribution
        assigned_tasks = len([t for t in project.tasks if t.assignee_id])
        unassigned_ratio = (total_tasks - assigned_tasks) / total_tasks if total_tasks > 0 else 0
        
        # Check for overloaded team members
        task_distribution = {}
        for task in project.tasks:
            if task.assignee_id:
                task_distribution[task.assignee_id] = task_distribution.get(task.assignee_id, 0) + 1
        
        if task_distribution:
            max_tasks = max(task_distribution.values())
            avg_tasks = sum(task_distribution.values()) / len(task_distribution)
            overload_ratio = max_tasks / avg_tasks if avg_tasks > 0 else 1
        else:
            overload_ratio = 1
        
        # Combine factors
        team_risk = (unassigned_ratio * 0.6) + (min(overload_ratio - 1, 1) * 0.4)
        return min(team_risk, 1.0)
    
    def _calculate_complexity_risk(self, project: Project) -> float:
        """Calculate complexity-related risk"""
        # Factors: number of tasks, dependencies, project type
        task_count = len(project.tasks)
        dependency_count = sum(len(t.dependencies) for t in project.tasks)
        
        # Normalize task count (assuming 50+ tasks is high complexity)
        task_complexity = min(task_count / 50, 1.0)
        
        # Normalize dependency complexity
        dependency_complexity = min(dependency_count / (task_count * 2) if task_count > 0 else 0, 1.0)
        
        # Project type complexity
        type_complexity = {
            'AI_Consulting': 0.8,
            'SaaS_Development': 0.7,
            'Infrastructure': 0.6,
            'System_Integration': 0.9
        }.get(project.project_type.value, 0.5)
        
        return (task_complexity * 0.4 + dependency_complexity * 0.3 + type_complexity * 0.3)
    
    def _calculate_external_risk(self, project: Project) -> float:
        """Calculate external risk factors"""
        # Check for explicitly defined risks
        high_risks = [r for r in project.risks if r.impact in [RiskLevel.HIGH, RiskLevel.CRITICAL]]
        
        if not project.risks:
            return 0.3  # Medium risk if no risks identified (might be oversight)
        
        # Calculate weighted risk based on probability and impact
        total_risk = 0
        for risk in project.risks:
            impact_weight = {
                RiskLevel.LOW: 0.2,
                RiskLevel.MEDIUM: 0.5,
                RiskLevel.HIGH: 0.8,
                RiskLevel.CRITICAL: 1.0
            }[risk.impact]
            
            total_risk += risk.probability * impact_weight
        
        return min(total_risk / len(project.risks), 1.0)
    
    def generate_risk_recommendations(self, project: Project) -> List[str]:
        """Generate risk mitigation recommendations"""
        recommendations = []
        risk_score = self.assess_project_risk(project)
        
        if risk_score > 0.7:
            recommendations.append("Project is at high risk - consider immediate intervention")
        
        # Schedule recommendations
        metrics = project.calculate_metrics()
        if metrics.overdue_tasks > 0:
            recommendations.append(f"Address {metrics.overdue_tasks} overdue tasks immediately")
        
        if metrics.blocked_tasks > 0:
            recommendations.append(f"Unblock {metrics.blocked_tasks} blocked tasks")
        
        # Team recommendations
        unassigned_tasks = [t for t in project.tasks if not t.assignee_id]
        if unassigned_tasks:
            recommendations.append(f"Assign {len(unassigned_tasks)} unassigned tasks")
        
        # Risk-specific recommendations
        critical_risks = [r for r in project.risks if r.impact == RiskLevel.CRITICAL]
        for risk in critical_risks:
            if not risk.mitigation_plan:
                recommendations.append(f"Develop mitigation plan for critical risk: {risk.risk_type}")
        
        return recommendations


class ProjectSchedulingService(DomainService):
    """Service for project scheduling and optimization"""
    
    def calculate_critical_path(self, project: Project) -> List[str]:
        """Calculate critical path through project tasks"""
        # Simplified critical path calculation
        # In a real implementation, this would use proper CPM algorithm
        
        task_map = {t.id: t for t in project.tasks}
        
        # Find tasks with no dependencies (start tasks)
        start_tasks = [t for t in project.tasks if not t.dependencies]
        
        # Find longest path (simplified)
        def get_task_duration(task: Task) -> float:
            return task.estimated_hours or 8.0  # Default 1 day
        
        def calculate_longest_path(task_id: str, visited: set) -> float:
            if task_id in visited:
                return 0  # Avoid cycles
            
            visited.add(task_id)
            task = task_map.get(task_id)
            if not task:
                return 0
            
            # Find dependent tasks
            dependent_tasks = [t for t in project.tasks if task_id in t.dependencies]
            
            if not dependent_tasks:
                return get_task_duration(task)
            
            max_path = 0
            for dep_task in dependent_tasks:
                path_length = calculate_longest_path(dep_task.id, visited.copy())
                max_path = max(max_path, path_length)
            
            return get_task_duration(task) + max_path
        
        # Find critical path
        critical_tasks = []
        max_duration = 0
        
        for start_task in start_tasks:
            duration = calculate_longest_path(start_task.id, set())
            if duration > max_duration:
                max_duration = duration
                # In real implementation, would track the actual path
                critical_tasks = [start_task.id]
        
        return critical_tasks
    
    def suggest_task_reallocation(self, project: Project) -> Dict[str, List[str]]:
        """Suggest task reallocation to balance workload"""
        # Calculate current workload per team member
        workload = {}
        for task in project.tasks:
            if task.assignee_id and task.status not in [TaskStatus.COMPLETED, TaskStatus.CANCELLED]:
                hours = task.estimated_hours or 8.0
                workload[task.assignee_id] = workload.get(task.assignee_id, 0) + hours
        
        if not workload:
            return {}
        
        # Find overloaded and underloaded team members
        avg_workload = sum(workload.values()) / len(workload)
        overloaded = {uid: load for uid, load in workload.items() if load > avg_workload * 1.5}
        underloaded = {uid: load for uid, load in workload.items() if load < avg_workload * 0.5}
        
        suggestions = {}
        
        # Suggest moving tasks from overloaded to underloaded team members
        for overloaded_user, _ in overloaded.items():
            user_tasks = [t for t in project.tasks if t.assignee_id == overloaded_user 
                         and t.status == TaskStatus.TODO]
            
            if user_tasks and underloaded:
                # Suggest moving lowest priority tasks
                tasks_to_move = sorted(user_tasks, key=lambda t: t.priority.value)[:2]
                target_user = min(underloaded.keys(), key=lambda u: workload[u])
                
                suggestions[overloaded_user] = [
                    f"Consider reassigning task '{t.title}' to {target_user}" 
                    for t in tasks_to_move
                ]
        
        return suggestions


# Specifications for project business rules
class OverdueProjectSpecification(Specification):
    """Specification for overdue projects"""
    
    def is_satisfied_by(self, project: Project) -> bool:
        return project.is_overdue()


class AtRiskProjectSpecification(Specification):
    """Specification for at-risk projects"""
    
    def is_satisfied_by(self, project: Project) -> bool:
        return project.is_at_risk()


class ActiveProjectSpecification(Specification):
    """Specification for active projects"""
    
    def is_satisfied_by(self, project: Project) -> bool:
        return project.status in [
            ProjectStatus.PLANNING,
            ProjectStatus.IN_PROGRESS,
            ProjectStatus.TESTING,
            ProjectStatus.DEPLOYMENT
        ]


class HighPriorityProjectSpecification(Specification):
    """Specification for high priority projects"""
    
    def is_satisfied_by(self, project: Project) -> bool:
        return project.priority in [Priority.HIGH, Priority.CRITICAL]


class ProjectNeedsAttentionSpecification(Specification):
    """Specification for projects needing immediate attention"""
    
    def __init__(self):
        self.overdue_spec = OverdueProjectSpecification()
        self.at_risk_spec = AtRiskProjectSpecification()
        self.high_priority_spec = HighPriorityProjectSpecification()
    
    def is_satisfied_by(self, project: Project) -> bool:
        return (self.overdue_spec.is_satisfied_by(project) or
                self.at_risk_spec.is_satisfied_by(project) or
                (self.high_priority_spec.is_satisfied_by(project) and 
                 project.calculate_metrics().completion_percentage < 50))
