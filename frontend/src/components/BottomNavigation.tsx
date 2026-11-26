import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

type Props = {
  activeTab: string;
  onNavigateToPlan: () => void;
  onNavigateToGenerator: () => void;
  onNavigateToSaved: () => void;
  onNavigateToProfile: () => void;
};

export default function BottomNavigation({
  activeTab,
  onNavigateToPlan,
  onNavigateToGenerator,
  onNavigateToSaved,
  onNavigateToProfile,
}: Props) {
  const tabs = [
    { name: 'Plan', label: 'Plan', icon: '📋', onPress: onNavigateToPlan },
    { name: 'Generator', label: 'Generator', icon: '⚙️', onPress: onNavigateToGenerator },
    { name: 'Zapisane', label: 'Zapisane', icon: '🗂️', onPress: onNavigateToSaved },
    { name: 'Profil', label: 'Profil', icon: '👤', onPress: onNavigateToProfile },
  ];

  return (
    <View style={styles.bottomNav}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.name}
          style={styles.navItem}
          onPress={tab.onPress}
        >
          <Text style={styles.navIcon}>{tab.icon}</Text>
          <Text
            style={[
              styles.navLabel,
              activeTab === tab.name && styles.activeLabel,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 10,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#888',
  },
  activeLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});