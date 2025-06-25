import React from 'react';
import { ScrollView, View, StyleSheet, RefreshControl } from 'react-native';
import { Card, Title, Paragraph, Button, Avatar, Chip, ProgressBar } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { projectsApi } from '../../src/services/api/projects';
import { billingApi } from '../../src/services/api/billing';
import { communicationApi } from '../../src/services/api/communication';
import { formatCurrency, formatDate } from '../../src/utils/format';
import { theme } from '../../src/theme';

export default function DashboardScreen() {
  const { client } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: projectStats, refetch: refetchProjects } = useQuery({
    queryKey: ['project-stats'],
    queryFn: projectsApi.getProjectStats,
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getProjects,
  });

  const { data: billingStats } = useQuery({
    queryKey: ['billing-stats'],
    queryFn: billingApi.getBillingStats,
  });

  const { data: communicationStats } = useQuery({
    queryKey: ['communication-stats'],
    queryFn: communicationApi.getCommunicationStats,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: communicationApi.getNotifications,
  });

  const activeProjects = projects?.filter(p => p.status === 'in-progress') || [];
  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetchProjects();
    setRefreshing(false);
  }, [refetchProjects]);

  const stats = [
    {
      title: 'Active Projects',
      value: projectStats?.activeProjects || 0,
      icon: 'folder',
      color: theme.colors.primary,
    },
    {
      title: 'Total Spent',
      value: formatCurrency(projectStats?.totalSpent || 0),
      icon: 'attach-money',
      color: theme.colors.secondary,
    },
    {
      title: 'Outstanding',
      value: formatCurrency(billingStats?.totalOutstanding || 0),
      icon: 'payment',
      color: theme.colors.tertiary,
    },
    {
      title: 'Unread Messages',
      value: communicationStats?.unreadMessages || 0,
      icon: 'message',
      color: theme.colors.error,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Header */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <View style={styles.welcomeHeader}>
            <View style={styles.welcomeText}>
              <Title style={styles.welcomeTitle}>
                Welcome back, {client?.firstName}!
              </Title>
              <Paragraph style={styles.welcomeSubtitle}>
                Here's what's happening with your projects today.
              </Paragraph>
            </View>
            <Avatar.Image
              size={60}
              source={{ uri: client?.avatar }}
              style={styles.avatar}
            />
          </View>
        </Card.Content>
      </Card>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <Card key={index} style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <View style={styles.statHeader}>
                <MaterialIcons
                  name={stat.icon as any}
                  size={24}
                  color={stat.color}
                />
                <Title style={styles.statValue}>{stat.value}</Title>
              </View>
              <Paragraph style={styles.statTitle}>{stat.title}</Paragraph>
            </Card.Content>
          </Card>
        ))}
      </View>

      {/* Active Projects */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title>Active Projects</Title>
            <Button
              mode="text"
              onPress={() => router.push('/projects')}
              compact
            >
              View All
            </Button>
          </View>
          {activeProjects.slice(0, 3).map((project) => (
            <View key={project.id} style={styles.projectItem}>
              <View style={styles.projectHeader}>
                <Title style={styles.projectTitle}>{project.name}</Title>
                <Chip
                  mode="outlined"
                  textStyle={styles.chipText}
                  style={[
                    styles.chip,
                    { backgroundColor: getPriorityColor(project.priority) }
                  ]}
                >
                  {project.priority}
                </Chip>
              </View>
              <Paragraph style={styles.projectDescription}>
                {project.description}
              </Paragraph>
              <View style={styles.progressContainer}>
                <ProgressBar
                  progress={project.progress / 100}
                  color={theme.colors.primary}
                  style={styles.progressBar}
                />
                <Paragraph style={styles.progressText}>
                  {project.progress}%
                </Paragraph>
              </View>
              <View style={styles.projectMeta}>
                <Paragraph style={styles.metaText}>
                  {project.teamMembers.length} members
                </Paragraph>
                <Paragraph style={styles.metaText}>
                  Due {formatDate(project.estimatedEndDate)}
                </Paragraph>
              </View>
            </View>
          ))}
          {activeProjects.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="folder-open"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Paragraph style={styles.emptyText}>No active projects</Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Recent Activity */}
      <Card style={styles.sectionCard}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title>Recent Activity</Title>
            <Button
              mode="text"
              onPress={() => router.push('/notifications')}
              compact
            >
              View All
            </Button>
          </View>
          {unreadNotifications.slice(0, 4).map((notification) => (
            <View key={notification.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <MaterialIcons
                  name={getNotificationIcon(notification.type)}
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <View style={styles.activityContent}>
                <Title style={styles.activityTitle}>
                  {notification.title}
                </Title>
                <Paragraph style={styles.activityMessage}>
                  {notification.message}
                </Paragraph>
                <Paragraph style={styles.activityTime}>
                  {formatDate(notification.createdAt)}
                </Paragraph>
              </View>
            </View>
          ))}
          {unreadNotifications.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="check-circle"
                size={48}
                color={theme.colors.onSurfaceVariant}
              />
              <Paragraph style={styles.emptyText}>You're all caught up!</Paragraph>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={[styles.sectionCard, styles.lastCard]}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Quick Actions</Title>
          <View style={styles.quickActions}>
            <Button
              mode="contained-tonal"
              icon="folder"
              onPress={() => router.push('/projects')}
              style={styles.actionButton}
            >
              Projects
            </Button>
            <Button
              mode="contained-tonal"
              icon="message"
              onPress={() => router.push('/messages')}
              style={styles.actionButton}
            >
              Messages
            </Button>
            <Button
              mode="contained-tonal"
              icon="payment"
              onPress={() => router.push('/billing')}
              style={styles.actionButton}
            >
              Billing
            </Button>
            <Button
              mode="contained-tonal"
              icon="help"
              onPress={() => router.push('/support')}
              style={styles.actionButton}
            >
              Support
            </Button>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return '#ffebee';
    case 'medium':
      return '#fff3e0';
    case 'low':
      return '#e8f5e8';
    default:
      return '#f5f5f5';
  }
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'project_update':
      return 'folder';
    case 'invoice_created':
      return 'payment';
    case 'message_received':
      return 'message';
    default:
      return 'notifications';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  welcomeCard: {
    margin: 16,
    marginBottom: 8,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeText: {
    flex: 1,
    marginRight: 16,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  welcomeSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  avatar: {
    backgroundColor: theme.colors.primaryContainer,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  statCard: {
    width: '48%',
    margin: 8,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  sectionCard: {
    margin: 16,
    marginTop: 8,
  },
  lastCard: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  projectItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  chip: {
    height: 24,
  },
  chipText: {
    fontSize: 10,
  },
  projectDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    marginRight: 8,
    height: 6,
  },
  progressText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  activityItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    marginBottom: 4,
  },
  activityMessage: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    color: theme.colors.onSurfaceVariant,
  },
});
