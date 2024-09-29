<template>
  <div class="code-diff-editor" ref="editorContainer"></div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { javascript } from "@codemirror/lang-javascript";
import { Decoration, ViewPlugin, EditorView } from "@codemirror/view";
import { StateField, StateEffect, EditorState } from "@codemirror/state";
import { diffChars } from "diff";

const props = defineProps({
  oldCode: { type: String, required: true },
  newCode: { type: String, required: true },
});

const editorContainer = ref(null);
const view = ref(null);

const applyChangeEffect = StateEffect.define();
const discardChangeEffect = StateEffect.define();

const diffField = StateField.define({
  create() {
    return { diffs: [], decorations: Decoration.none };
  },
  update(value, tr) {
    for (let e of tr.effects) {
      if (e.is(applyChangeEffect)) {
        value = applyChange(value, e.value);
      } else if (e.is(discardChangeEffect)) {
        value = discardChange(value, e.value);
      }
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f, (value) => value.decorations),
});

function computeDiffs(oldCode, newCode) {
  return diffChars(oldCode, newCode);
}

function createDecorations(diffs) {
  let pos = 0;
  const decorations = [];

  diffs.forEach((part, index) => {
    const from = pos;
    const to = pos + part.value.length;

    if (part.added || part.removed) {
      const decoration = Decoration.mark({
        class: part.added ? "cm-diff-added" : "cm-diff-removed",
        attributes: { "data-diff-index": index.toString() },
      }).range(from, to);

      decorations.push(decoration);
    }

    if (!part.removed) {
      pos = to;
    }
  });

  return Decoration.set(decorations);
}

function applyChange(value, index) {
  const newDiffs = [...value.diffs];
  const diff = newDiffs[index];
  if (diff.added) {
    newDiffs.splice(index - 1, 2, { value: diff.value, applied: true });
  }
  return { diffs: newDiffs, decorations: createDecorations(newDiffs) };
}

function discardChange(value, index) {
  const newDiffs = [...value.diffs];
  const diff = newDiffs[index];
  if (diff.removed) {
    newDiffs.splice(index, 2, { value: diff.value, applied: true });
  } else if (diff.added) {
    newDiffs.splice(index, 1);
  }
  return { diffs: newDiffs, decorations: createDecorations(newDiffs) };
}

onMounted(() => {
  const diffs = computeDiffs(props.oldCode, props.newCode);
  const startState = EditorState.create({
    doc: diffs.map((d) => d.value).join(""),
    extensions: [
      EditorView.editable.of(false),
      javascript(),
      diffField.init(() => ({ diffs, decorations: createDecorations(diffs) })),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          // Handle document changes if needed
        }
      }),
      EditorView.domEventHandlers({
        click: (event, view) => {
          const target = event.target;
          if (target.classList.contains("apply-change")) {
            const index = parseInt(target.getAttribute("data-diff-index"));
            view.dispatch({ effects: applyChangeEffect.of(index) });
          } else if (target.classList.contains("discard-change")) {
            const index = parseInt(target.getAttribute("data-diff-index"));
            view.dispatch({ effects: discardChangeEffect.of(index) });
          }
        },
      }),
    ],
  });

  view.value = new EditorView({
    state: startState,
    parent: editorContainer.value,
  });

  addApplyDiscardButtons(view.value);
});

function addApplyDiscardButtons(view) {
  const diffMarks = view.dom.querySelectorAll(
    ".cm-diff-added, .cm-diff-removed"
  );

  diffMarks.forEach((mark) => {
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "diff-buttons";

    const diffIndex = mark.getAttribute("data-diff-index");

    const applyButton = createButton("Apply", "apply-change", diffIndex);
    const discardButton = createButton("Discard", "discard-change", diffIndex);

    buttonContainer.appendChild(applyButton);
    buttonContainer.appendChild(discardButton);
    mark.appendChild(buttonContainer);
  });
}

function createButton(text, className, diffIndex) {
  const button = document.createElement("button");
  button.textContent = text;
  button.className = className;
  button.setAttribute("data-diff-index", diffIndex);
  return button;
}

watch(
  [() => props.oldCode, () => props.newCode],
  ([newOldCode, newNewCode]) => {
    if (view.value) {
      const diffs = computeDiffs(newOldCode, newNewCode);
      view.value.dispatch({
        changes: {
          from: 0,
          to: view.value.state.doc.length,
          insert: diffs.map((d) => d.value).join(""),
        },
        effects: diffField.update(() => ({
          diffs,
          decorations: createDecorations(diffs),
        })),
      });
      addApplyDiscardButtons(view.value);
    }
  }
);
</script>

<style>
.code-diff-editor {
  position: relative;
}
.cm-diff-added {
  background-color: #e6ffed;
}
.cm-diff-removed {
  background-color: #ffeef0;
}
.diff-buttons {
  position: absolute;
  right: 0;
  top: 0;
}
</style>
