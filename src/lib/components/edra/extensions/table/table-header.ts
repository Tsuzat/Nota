import { TableHeader as TiptapTableHeader } from '@tiptap/extension-table';
import { Plugin } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

import { getCellsInRow, isColumnSelected, selectColumn } from './utils.js';

export const TableHeader = TiptapTableHeader.extend({
	addAttributes() {
		return {
			colspan: {
				default: 1
			},
			rowspan: {
				default: 1
			},
			colwidth: {
				default: null,
				parseHTML: (element) => {
					const colwidth = element.getAttribute('colwidth');
					const value = colwidth ? colwidth.split(',').map((item) => parseInt(item, 10)) : null;

					return value;
				}
			},
			style: {
				default: null
			}
		};
	},

	addProseMirrorPlugins() {
		const { isEditable } = this.editor;

		return [
			new Plugin({
				props: {
					decorations: (state) => {
						if (!isEditable) {
							return DecorationSet.empty;
						}

						const { doc, selection } = state;
						const decorations: Decoration[] = [];
						const cells = getCellsInRow(0)(selection);

						if (cells) {
							cells.forEach(({ pos }: { pos: number }, index: number) => {
								decorations.push(
									Decoration.widget(pos + 1, () => {
										const colSelected = isColumnSelected(index)(selection);
										let className = 'grip-column';

										if (colSelected) {
											className += ' selected';
										}

										if (index === 0) {
											className += ' first';
										}

										if (index === cells.length - 1) {
											className += ' last';
										}

										const grip = document.createElement('a');

										grip.className = className;
										grip.setAttribute('role', 'button');
										grip.setAttribute('aria-label', 'Select column');
										grip.addEventListener('mousedown', (event) => {
											event.preventDefault();
											event.stopImmediatePropagation();

											this.editor.view.dispatch(selectColumn(index)(this.editor.state.tr));
										});

										return grip;
									})
								);
							});

							// Add-column "+" button — anchored to the last column of the header row
							const lastHeaderCell = cells[cells.length - 1];
							decorations.push(
								Decoration.widget(lastHeaderCell.pos + 1, () => {
									const btn = document.createElement('button');
									btn.className = 'add-column-btn';
									btn.type = 'button';
									btn.setAttribute('aria-label', 'Add column');
									btn.textContent = '+';
									btn.addEventListener('mousedown', (event) => {
										event.preventDefault();
										event.stopImmediatePropagation();
										// Select last column, then add after
										this.editor.view.dispatch(selectColumn(cells.length - 1)(this.editor.state.tr));
										this.editor.chain().focus().addColumnAfter().run();
									});

									return btn;
								})
							);
						}

						return DecorationSet.create(doc, decorations);
					}
				}
			})
		];
	}
});

export default TableHeader;
