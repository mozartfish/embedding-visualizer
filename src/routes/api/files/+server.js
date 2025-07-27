import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

export async function GET() {
	try {
		const dataPath = path.join(process.cwd(), 'static', 'data');
		const files = fs.readdirSync(dataPath);

		// Filter out directories, only return files
		const fileList = files.filter((file) => {
			const filePath = path.join(dataPath, file);
			return fs.statSync(filePath).isFile();
		});

		return json(fileList);
	} catch (error) {
		console.error('Error reading files:', error);
		return json({ error: 'Unable to read files' }, { status: 500 });
	}
}
