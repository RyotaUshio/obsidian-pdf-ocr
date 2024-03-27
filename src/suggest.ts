
import { AbstractInputSuggest, App, Command, FuzzyMatch, SearchResultContainer, TFile, TFolder, prepareFuzzySearch, renderResults, sortSearchResults } from 'obsidian';


type FuzzyInputSuggestOptions = {
    blurOnSelect: boolean;
    closeOnSelect: boolean;
}

const DEFAULT_FUZZY_INPUT_SUGGEST_OPTIONS: FuzzyInputSuggestOptions = {
    blurOnSelect: true,
    closeOnSelect: true,
}


export abstract class FuzzyInputSuggest<T> extends AbstractInputSuggest<FuzzyMatch<T>> {
	inputEl: HTMLInputElement | HTMLDivElement;
    options: FuzzyInputSuggestOptions;

	constructor(app: App, inputEl: HTMLInputElement | HTMLDivElement, options?: Partial<FuzzyInputSuggestOptions>) {
		super(app, inputEl);
		this.inputEl = inputEl;
        this.options = Object.assign(DEFAULT_FUZZY_INPUT_SUGGEST_OPTIONS, options);
	}

	abstract getItems(): T[];
	abstract getItemText(item: T): string;

	getSuggestions(query: string) {
		const search = prepareFuzzySearch(query.trim());
		const items = this.getItems()

		const results: FuzzyMatch<T>[] = [];

		for (const item of items) {
			const match = search(this.getItemText(item));
			if (match) results.push({ match, item });
		}

		sortSearchResults(results);

		return results;
	}

	renderSuggestion(result: FuzzyMatch<T>, el: HTMLElement) {
		renderResults(el, this.getItemText(result.item), result.match);
	}

	selectSuggestion(result: FuzzyMatch<T>, evt: MouseEvent | KeyboardEvent) {
		// @ts-ignore
		super.selectSuggestion(result, evt); // this ts-ignore is needed due to a bug in Obsidian's type definition
        if (this.options.blurOnSelect) this.inputEl.blur();
        if (this.inputEl instanceof HTMLInputElement) {
            this.inputEl.value = this.getItemText(result.item);
        } else {
            this.inputEl.textContent = this.getItemText(result.item);
        }
		if (this.options.closeOnSelect) this.close();
	}
}


export class FuzzyMarkdownFileSuggest extends FuzzyInputSuggest<TFile> {
	getItems() {
		return this.app.vault.getMarkdownFiles();
	}

	getItemText(file: TFile) {
		return file.path;
	}
}


export class FuzzyFolderSuggest extends FuzzyInputSuggest<TFolder> {
	getItems() {
		return this.app.vault.getAllLoadedFiles().filter((file): file is TFolder => file instanceof TFolder)
	}

	getItemText(file: TFolder) {
		return file.path;
	}
}
