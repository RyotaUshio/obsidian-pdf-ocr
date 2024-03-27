import { FileSystemAdapter, Notice, Plugin, TFile } from 'obsidian';
import { exec } from 'child_process';

import { PdfOcrSettings, DEFAULT_SETTINGS, PdfOcrSettingTab } from 'settings';


export default class PdfOcrPlugin extends Plugin {
	settings: PdfOcrSettings;
	adapter: FileSystemAdapter;

	async onload() {
		const adapter = this.app.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) {
			new Notice(`${this.manifest.name}: Cannot enable plugin because app.vault.adapter is not a FileSystemAdapter.`)
			return;
		}
		this.adapter = adapter;

		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new PdfOcrSettingTab(this));

		this.addCommand({
			id: 'ocrmypdf',
			name: 'Run OCR',
			checkCallback: (checking) => this.ocrMyPdf(checking)
		});

		this.registerEvent(this.app.workspace.on('file-menu', (menu, file) => {
			if (file instanceof TFile && file.extension === 'pdf') {
				menu.addItem((item) => {
					item.setTitle('Run OCR')
						.onClick(() => this.ocrMyPdf(false));
				});
			}
		}));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	ocrMyPdf(checking: boolean) {
		const file = this.app.workspace.getActiveFile();
		if (!file || file.extension !== 'pdf') return;

		if (!checking) {
			const env = Object.assign({}, process.env);
			if (this.settings.path) {
				env.PATH = this.settings.path;
			}
			const absPath = this.adapter.getFullPath(file.path);
			const cmd = `ocrmypdf ${this.settings.option} "${absPath}" "${absPath}"`;

			const notice = new Notice(`${this.manifest.name}: Processing ${file.path}...`, 0);

			exec(cmd, { env }, (err) => {
				notice.hide();

				if (!err) {
					new Notice(`${this.manifest.name}: OCR successfully completed.`)
					return;
				}

				new Notice(`${this.manifest.name}: OCR failed. See the developer console for the details.`);
				console.error(err);
			});
		}

		return true;
	}
}
