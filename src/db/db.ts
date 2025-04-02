import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const db_url = process.env.DATABASE_URL;

if (!db_url){
    throw new Error('Db url is not provided.')
}

const connection = async () => {
    const queryClient = postgres(db_url);
    const db = drizzle({ client: queryClient });
    const result = await db.execute('select 1');
}
