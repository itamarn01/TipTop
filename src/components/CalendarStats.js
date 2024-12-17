import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { MaterialIcons } from '@expo/vector-icons';

export default function CalendarStats({ stats }) {
    return (
        <Animatable.View animation="fadeInUp" style={styles.statsContainer}>
            <View style={styles.statCard}>
                <MaterialIcons name="event" size={24} color="#014495" />
                <Text style={styles.statNumber}>{stats.totalTreatments}</Text>
                <Text style={styles.statLabel}>Treatments</Text>
            </View>

            <View style={styles.statCard}>
                <MaterialIcons name="attach-money" size={24} color="#014495" />
                <Text style={styles.statNumber}>${stats.totalRevenue}</Text>
                <Text style={styles.statLabel}>Revenue</Text>
            </View>

            <View style={styles.statCard}>
                <MaterialIcons name="people" size={24} color="#014495" />
                <Text style={styles.statNumber}>{stats.uniqueClientsCount}</Text>
                <Text style={styles.statLabel}>Clients</Text>
            </View>
        </Animatable.View>
    );
}

const styles = StyleSheet.create({
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 15,
        backgroundColor: 'white',
        marginHorizontal: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginTop: -20,
        zIndex: 1,
    },
    statCard: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#014495',
        marginTop: 5,
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
});
