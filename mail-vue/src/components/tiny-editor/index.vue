<template>
  <div class="editor-box" :class="showLoading ? 'editor-box-loading' : ''">
    <loading class="loading" v-if="showLoading" />
    <textarea v-else style="outline: none" :id="editorId" ref="editorRef"></textarea>
  </div>
</template>

<script setup>
import {ref, onMounted, onBeforeUnmount, watch, nextTick, shallowRef, defineEmits} from 'vue';
import loading from "@/components/loading/index.vue";
import {compressImage} from "@/utils/file-utils.js";
defineExpose({
  clearEditor,
  focus,
  getContent
})

const props = defineProps({
  defValue: {
    type: String,
    default: ''
  },
  editorId: {
    type: String,
    default: () => `editor-${Date.now()}`
  }
});


const emit = defineEmits(['change']);
const editor = shallowRef(null);
const isInitialized = ref(false);
const editorRef = ref(null);
const showLoading = ref(false);

onMounted(() => {
  initTinyMCE();
});

onBeforeUnmount(() => {
  destroyEditor();
});

watch(() => props.defValue, (newValue) => {
  if (editor.value && editor.value.getContent() !== newValue) {
    editor.value.setContent(newValue);
  }
});

function clearEditor() {
  if (editor.value) {
    editor.value.setContent('');
  }
}

function initTinyMCE() {
  if (window.tinymce) {
    initEditor();
  } else {
    showLoading.value = true;
    const script = document.createElement('script');
    script.src = '/tinymce/tinymce.min.js';
    script.onload = () => initEditor();
    document.head.appendChild(script);
    showLoading.value = false;
  }
}

function initEditor() {
  window.tinymce.init({
    selector: `#${props.editorId}`,
    statusbar: false,
    height: "100%",
    auto_focus: true,
    forced_root_block: 'div',
    plugins: 'link image advlist lists  emoticons fullscreen  table preview code',
    toolbar: 'bold emoticons forecolor backcolor italic fontsize | alignleft aligncenter alignright alignjustify | outdent indent |  bullist numlist | link image  | table code preview fullscreen',
    toolbar_mode: 'scrolling',
    mobile: {
      toolbar: 'fullscreen bold emoticons forecolor backcolor italic fontsize | alignleft aligncenter alignright alignjustify | outdent indent |  bullist numlist | link image  | table code preview ',
    },
    font_size_formats: '8px 10px 12px 14px 16px 18px 24px 36px',
    emoticons_search: false,
    language: 'zh_CN',
    language_url: '/tinymce/langs/zh_CN.js',
    menubar: false,
    license_key: 'gpl',
    noneditable_class: 'mceNonEditable',
    content_style: ` .tox-dialog__body-content  { margin: 0 !important; }
    img { max-width: 100% !important; height: auto !important; }
    body {margin: 10px 8px 0 5px !important; font-family: 'HarmonyOS'; font-size: 14px;}
    @media (pointer: fine) and (hover: hover) {
        ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }


        ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
        }


        ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
            cursor: pointer;
        }
    }
    .mce-item-table:not([border]), .mce-item-table:not([border]) caption, .mce-item-table:not([border]) td, .mce-item-table:not([border]) th, .mce-item-table[border="0"], .mce-item-table[border="0"] caption, .mce-item-table[border="0"] td, .mce-item-table[border="0"] th, table[style*="border-width: 0px"], table[style*="border-width: 0px"] caption, table[style*="border-width: 0px"] td, table[style*="border-width: 0px"] th {
        border: none;
    }
    `,
    setup: (ed) => {
      editor.value = ed;
      ed.on('init', () => {
        ed.setContent(props.defValue);
        isInitialized.value = true;
      });
      ed.on('input change', () => {
        const content = ed.getContent();
        const text = ed.getContent({ format: 'text' });
        emit('change', content, text);
      });
    },
    autofocus: true,
    branding: false,
    file_picker_types: 'image',
    image_dimensions: false,
    image_description: false,
    link_title: false,
    dialog_type: 'none',
    file_picker_callback:  (callback, value, meta) => {
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      input.setAttribute('accept', 'image/*');

      input.addEventListener('change', async (e) => {
        let file = e.target.files[0];
        file = await compressImage(file);
        const reader = new FileReader();
        reader.onload = () => {
          const id = 'blobid' + (new Date()).getTime();
          const blobCache =  tinymce.activeEditor.editorUpload.blobCache;
          const base64 = reader.result.split(',')[1];
          const blobInfo = blobCache.create(id, file, base64);
          blobCache.add(blobInfo);

          callback(blobInfo.blobUri(), { title: file.name });
        }
        reader.readAsDataURL(file);
      });

      input.click();
    }
  });
}

function focus() {
  nextTick(() => {
    editor.value.focus()
  })
}

function getContent() {
  return editor.value.getContent()
}


function destroyEditor() {
  if (editor.value) {
    editor.value.destroy();
    editor.value = null;
  }
}
</script>

<style lang="scss" scoped>
.editor-box {
  height: 100%;
  width: 100%;
}

.loading {
  margin: auto;
}

.editor-box-loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

:deep(.tox-tbtn.tox-tbtn--select.tox-tbtn--bespoke) {
  width: 80px !important;
}

:deep(.tox.tox-tinymce.tox-fullscreen) {
  padding-right: 15px;
  padding-left: 15px;
  padding-bottom: 15px;
  background: #FFFFFF;
  @media (max-width: 767px) {
    padding-right: 10px;
    padding-left: 10px;
    padding-bottom: 10px;
  }
}

:deep(.tox-tinymce) {
  border: none;
  border-radius: 0;
}

:deep(.tox-toolbar__group) {
  padding-left: 0 !important;
  margin: 0 !important;
}

:deep(.tox-tbtn) {
  margin: 0 !important;
}

:deep(.tox .tox-edit-area::before) {
  display: none;
}

</style>