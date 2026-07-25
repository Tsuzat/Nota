<script lang="ts">
import { Textarea } from '@lib/components/ui/textarea/index.js';
import { BubbleMenu, getEditor, useEditorState } from '../../../tiptap/index.js';
import strings from '../../../strings.js';

const editor = getEditor();
const editorState = useEditorState({
  editor,
  selector: ({ editor }) => ({
    latex: editor.getAttributes('blockMath').latex as string,
  }),
});
let latex = $derived($editorState.latex);

function updateLatex() {
  editor.commands.updateBlockMath({ latex });
}
</script>

<BubbleMenu
	{editor}
	pluginKey="math-block-bubble-menu"
	appendTo={() => document.body}
	shouldShow={(props) => {
		const { editor: propsEditor, state } = props;
		if (!propsEditor || !propsEditor.isEditable) return false;
		if (!state) return false;
		return propsEditor.isActive('blockMath');
	}}
	options={{
		strategy: 'fixed',
		placement: 'top',
		autoPlacement: false,
		flip: {
			fallbackPlacements: ['bottom'],
			padding: 12,
			boundary: editor.view.dom
		},
		shift: {
			padding: 12,
			boundary: editor.view.dom
		},
		scrollTarget: editor.view.dom.parentElement ?? window
	}}
	class="z-50 h-fit w-fit max-w-[calc(100vw-2rem)] flex-col items-center gap-1 rounded-lg border bg-popover shadow-lg"
>
	<Textarea
		bind:value={latex}
		oninput={updateLatex}
		placeholder={strings.menu.math.enterExpressionPlaceholder}
		class="h-48 w-96"
	/>
</BubbleMenu>
