import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import type { WeeklyUpdateItem } from '$lib/server/email/weekly-updates-email.service';

export interface ParsedWeeklyUpdate {
	date: string;
	updates: WeeklyUpdateItem[];
	highlights: WeeklyUpdateItem[];
	upcoming: WeeklyUpdateItem[];
	notes?: string;
}

export class WeeklyUpdatesParserService {
	private static readonly UPDATES_DIR = join(process.cwd(), 'weekly-updates');

	/**
	 * Get the most recent weekly update file
	 */
	static getLatestWeeklyUpdate(): ParsedWeeklyUpdate | null {
		try {
			const files = this.getWeeklyUpdateFiles();
			if (files.length === 0) {
				console.log('No weekly update files found');
				return null;
			}

			// Sort by date (most recent first)
			const sortedFiles = files.sort((a, b) => {
				const dateA = this.extractDateFromFilename(a);
				const dateB = this.extractDateFromFilename(b);
				return dateB.getTime() - dateA.getTime();
			});

			const latestFile = sortedFiles[0];
			return this.parseWeeklyUpdateFile(latestFile);
		} catch (error) {
			console.error('Error getting latest weekly update:', error);
			return null;
		}
	}

	/**
	 * Get all weekly update files
	 */
	static getAllWeeklyUpdates(): ParsedWeeklyUpdate[] {
		try {
			const files = this.getWeeklyUpdateFiles();
			return files
				.map((file) => this.parseWeeklyUpdateFile(file))
				.filter((update) => update !== null) as ParsedWeeklyUpdate[];
		} catch (error) {
			console.error('Error getting all weekly updates:', error);
			return [];
		}
	}

	/**
	 * Get weekly update files from the directory
	 */
	private static getWeeklyUpdateFiles(): string[] {
		try {
			const files = readdirSync(this.UPDATES_DIR);
			return files
				.filter((file) => file.startsWith('Updates-') && file.endsWith('.md'))
				.map((file) => join(this.UPDATES_DIR, file));
		} catch (error) {
			console.error('Error reading weekly updates directory:', error);
			return [];
		}
	}

	/**
	 * Parse a weekly update markdown file
	 */
	private static parseWeeklyUpdateFile(filePath: string): ParsedWeeklyUpdate | null {
		try {
			const content = readFileSync(filePath, 'utf-8');
			const filename = filePath.split('/').pop() || '';
			const date = this.extractDateFromFilename(filename);

			// Parse the markdown content
			const sections = this.parseMarkdownSections(content);

			return {
				date: date.toISOString().split('T')[0], // YYYY-MM-DD format
				updates: sections.updates,
				highlights: sections.highlights,
				upcoming: sections.upcoming,
				notes: sections.notes
			};
		} catch (error) {
			console.error(`Error parsing weekly update file ${filePath}:`, error);
			return null;
		}
	}

	/**
	 * Extract date from filename (Updates-MM-DD-YYYY.md)
	 */
	private static extractDateFromFilename(filename: string): Date {
		const match = filename.match(/Updates-(\d{2})-(\d{2})-(\d{4})\.md/);
		if (!match) {
			throw new Error(`Invalid filename format: ${filename}`);
		}

		const [, month, day, year] = match;
		return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
	}

	/**
	 * Parse markdown sections into structured data
	 */
	private static parseMarkdownSections(content: string): {
		updates: WeeklyUpdateItem[];
		highlights: WeeklyUpdateItem[];
		upcoming: WeeklyUpdateItem[];
		notes?: string;
	} {
		const sections = {
			updates: [] as WeeklyUpdateItem[],
			highlights: [] as WeeklyUpdateItem[],
			upcoming: [] as WeeklyUpdateItem[],
			notes: undefined as string | undefined
		};

		// Split content into sections
		const lines = content.split('\n');
		let currentSection = '';
		let currentContent: string[] = [];

		for (const line of lines) {
			const trimmedLine = line.trim();

			// Check for section headers
			if (trimmedLine.startsWith('## ')) {
				// Process previous section
				if (currentSection && currentContent.length > 0) {
					this.processSection(currentSection, currentContent, sections);
				}

				// Start new section
				currentSection = trimmedLine.replace('## ', '').toLowerCase();
				currentContent = [];
			} else if (trimmedLine && !trimmedLine.startsWith('#')) {
				currentContent.push(line);
			}
		}

		// Process the last section
		if (currentSection && currentContent.length > 0) {
			this.processSection(currentSection, currentContent, sections);
		}

		return sections;
	}

	/**
	 * Process a section and add items to the appropriate array
	 */
	private static processSection(
		sectionName: string,
		content: string[],
		sections: {
			updates: WeeklyUpdateItem[];
			highlights: WeeklyUpdateItem[];
			upcoming: WeeklyUpdateItem[];
			notes?: string;
		}
	): void {
		const sectionKey = this.getSectionKey(sectionName);
		if (!sectionKey) return;

		if (sectionKey === 'notes') {
			sections.notes = content.join('\n').trim();
			return;
		}

		const items = this.parseListItems(content);
		sections[sectionKey] = items;
	}

	/**
	 * Map section names to keys
	 */
	private static getSectionKey(sectionName: string): keyof typeof sections | null {
		const lowerName = sectionName.toLowerCase();

		if (lowerName.includes('shipped') || lowerName.includes('what shipped')) {
			return 'updates';
		}
		if (lowerName.includes('highlight')) {
			return 'highlights';
		}
		if (lowerName.includes('coming') || lowerName.includes('next')) {
			return 'upcoming';
		}
		if (lowerName.includes('note')) {
			return 'notes';
		}

		return null;
	}

	/**
	 * Parse list items from markdown content
	 */
	private static parseListItems(content: string[]): WeeklyUpdateItem[] {
		const items: WeeklyUpdateItem[] = [];
		let currentItem: Partial<WeeklyUpdateItem> = {};

		for (const line of content) {
			const trimmedLine = line.trim();

			// Skip empty lines
			if (!trimmedLine) continue;

			// Check for list item (starts with - or *)
			if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
				// Save previous item if exists
				if (currentItem.title) {
					items.push(currentItem as WeeklyUpdateItem);
				}

				// Start new item
				const itemText = trimmedLine.substring(2).trim();
				const { title, summary, linkLabel, linkUrl } = this.parseItemText(itemText);

				currentItem = {
					title,
					summary,
					linkLabel,
					linkUrl
				};
			} else if (currentItem.title && trimmedLine) {
				// Continuation of current item
				currentItem.summary += ' ' + trimmedLine;
			}
		}

		// Add the last item
		if (currentItem.title) {
			items.push(currentItem as WeeklyUpdateItem);
		}

		return items;
	}

	/**
	 * Parse item text to extract title, summary, and links
	 */
	private static parseItemText(text: string): {
		title: string;
		summary: string;
		linkLabel?: string;
		linkUrl?: string;
	} {
		// Look for markdown links [text](url)
		const linkMatch = text.match(/\[([^\]]+)\]\(([^)]+)\)/);

		if (linkMatch) {
			const linkText = linkMatch[1];
			const linkUrl = linkMatch[2];
			const textWithoutLink = text.replace(/\[([^\]]+)\]\(([^)]+)\)/, '').trim();

			// Split into title and summary
			const colonIndex = textWithoutLink.indexOf(':');
			if (colonIndex > 0) {
				return {
					title: textWithoutLink.substring(0, colonIndex).trim(),
					summary: textWithoutLink.substring(colonIndex + 1).trim(),
					linkLabel: linkText,
					linkUrl: linkUrl
				};
			} else {
				return {
					title: textWithoutLink,
					summary: '',
					linkLabel: linkText,
					linkUrl: linkUrl
				};
			}
		}

		// No link, split by colon
		const colonIndex = text.indexOf(':');
		if (colonIndex > 0) {
			return {
				title: text.substring(0, colonIndex).trim(),
				summary: text.substring(colonIndex + 1).trim()
			};
		}

		// No colon, use entire text as title
		return {
			title: text,
			summary: ''
		};
	}
}
