import { openDatabaseSync } from 'expo-sqlite';

export const db = openDatabaseSync('devtask.db');
