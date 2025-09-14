// components/ReportCard.js
import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

const ReportCard = ({ report }) => {
  const statusColor = report.status === 'resolved' ? 'green' : 'orange';

  return (
    <View style={styles.card}>
      <Text style={styles.title}>{report.text}</Text>
      <View style={styles.detailsContainer}>
        <Text style={styles.detailText}>
          <Text style={styles.boldText}>Category:</Text> {report.category}
        </Text>
        <Text style={styles.detailText}>
          <Text style={styles.boldText}>Status:</Text> 
          <Text style={{ ...styles.statusText, color: statusColor }}> {report.status}</Text>
        </Text>
        {report.username && (
          <Text style={styles.detailText}>
            <Text style={styles.boldText}>User:</Text> {report.username}
          </Text>
        )}
      </View>

      {report.image_url && (
        <Image 
          source={{ uri: report.image_url }} 
          style={styles.image} 
          resizeMode="cover" 
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  detailsContainer: {
    marginBottom: 10,
  },
  detailText: {
    fontSize: 14,
    color: '#555',
  },
  boldText: {
    fontWeight: '600',
  },
  statusText: {
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
});

export default ReportCard;