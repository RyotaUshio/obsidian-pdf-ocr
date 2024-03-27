import { Component, PluginSettingTab, Setting } from 'obsidian';
import PdfOcrPlugin from 'main';
import { FuzzyInputSuggest } from 'suggest';
import { TESSERACT_LANGUAGES, TesseractLanguage } from 'lang';


export interface PdfOcrSettings {
	path: string;
	option: string;
}

export const DEFAULT_SETTINGS: PdfOcrSettings = {
	path: '',
	option: [
		'--output-type pdf',
		'-l jpn+eng',
		'--skip-text'
	].join(' ')
};

// Inspired by https://stackoverflow.com/a/50851710/13613783
export type KeysOfType<Obj, Type> = NonNullable<{ [k in keyof Obj]: Obj[k] extends Type ? k : never }[keyof Obj]>;

export class PdfOcrSettingTab extends PluginSettingTab {
	items: Partial<Record<keyof PdfOcrSettings, Setting>> = {};
	component = new Component();

	constructor(public plugin: PdfOcrPlugin) {
		super(plugin.app, plugin);
	}

	get settings() {
		return this.plugin.settings;
	}

	addSetting(settingName?: keyof PdfOcrSettings) {
		const item = new Setting(this.containerEl);
		if (settingName) this.items[settingName] = item;
		return item;
	}

	addTextSetting(settingName: KeysOfType<PdfOcrSettings, string>, options?: Partial<{
		placeholder: string,
		onBlurOrEnter: (setting: Setting) => any,
		size: number,
	}>) {
		const { placeholder, onBlurOrEnter, size } = options ?? {};

		const setting = this.addSetting(settingName)
			.addText((text) => {
				text.setValue(this.plugin.settings[settingName])
					.setPlaceholder(placeholder ?? '')
					.then((text) => {
						if (placeholder) {
							text.inputEl.size = Math.max(text.inputEl.size, text.inputEl.placeholder.length);
						} else if (size) {
							text.inputEl.size = size;
						}
					})
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
					});
				if (onBlurOrEnter) {
					this.component.registerDomEvent(text.inputEl, 'blur', () => {
						onBlurOrEnter(setting)
					});
					this.component.registerDomEvent(text.inputEl, 'keypress', (evt) => {
						if (evt.key === 'Enter') onBlurOrEnter(setting);
					});
				}
			});
		return setting;
	}

	display(): void {
		this.containerEl.empty();

		this.addTextSetting('path', { size: 40 })
			.setName('"PATH" environment variable')

		this.addTextSetting('option', { size: 40 })
			.setName('Optional arguments to ocrmypdf')
	}
}
