import { defineComponent } from 'vue'
import { getUrl, request } from '../../utils/request'
import { getLocalUserInfo } from '../../utils/user'

//Introduce tinymce editor
import Editor from '@tinymce/tinymce-vue'

//Introduce tinymce related files in node_modules
import tinymce from 'tinymce/tinymce' //static/tinymce is hidden by default, and the editor will not be displayed if it is not imported
import 'tinymce/themes/silver' //Editor theme, if not imported, an error will be reported
import 'tinymce/icons/default' //Introduce the editor icon icon, if not, the corresponding icon will not be displayed
import 'tinymce/models/dom'
// extension plugin
//import 'tinymce/plugins/advlist' //advance list
import 'tinymce/plugins/anchor' //anchor
import 'tinymce/plugins/autolink' //Auto link
import 'tinymce/plugins/autoresize' //The editor is highly adaptive, Note: When this plugin is introduced in plugins, the height set in Init will be invalid
//import 'tinymce/plugins/autosave' //Auto save
import 'tinymce/plugins/charmap' //special characters
import 'tinymce/plugins/code' //edit the source code
import 'tinymce/plugins/codesample' //code sample
import 'tinymce/plugins/directionality' //text direction
import 'tinymce/plugins/emoticons' //expression
import 'tinymce/plugins/fullscreen' //full screen
import 'tinymce/plugins/help' //help
import 'tinymce/plugins/image' //Insert editing image
//import 'tinymce/plugins/editimage' //image tool
import 'tinymce/plugins/importcss' //import css
import 'tinymce/plugins/insertdatetime' //Insert date time
import 'tinymce/plugins/link' //Hyperlink
import 'tinymce/plugins/lists' //list plugin
import 'tinymce/plugins/media' //Insert editing media
import 'tinymce/plugins/nonbreaking' //insert nonbreaking spaces
import 'tinymce/plugins/pagebreak' //insert page break
//import 'tinymce/plugins/paste' //paste plugin
import 'tinymce/plugins/preview'//preview
//import 'tinymce/plugins/print'//print
import 'tinymce/plugins/quickbars' //quickbars
import 'tinymce/plugins/save' //Save
import 'tinymce/plugins/searchreplace' //find and replace
// import 'tinymce/plugins/spellchecker' //Spelling check, Chineseization has not been added yet, it is not recommended to use
//import 'tinymce/plugins/tabfocus' //cut in and out, press the tab key to cut out the editor, and cut into other input boxes on the page
import 'tinymce/plugins/table' //table
import 'tinymce/plugins/template' //Content template
//import 'tinymce/plugins/textcolor' //text color
//import 'tinymce/plugins/textpattern' //quick typesetting
//import 'tinymce/plugins/tableofcontents' //directory generator
import 'tinymce/plugins/visualblocks' //Display element scope
import 'tinymce/plugins/visualchars' //Display invisible characters
import 'tinymce/plugins/wordcount' //word count

export default defineComponent({
    props: {
        value: {
            type: String,
            default: ''
        },
        baseUrl: {
            type: String,
            default: window.location.origin ? window.location.origin : ''
          },
        disabled: {
            type: Boolean,
            default: false
        },
        plugins: {
            type: [String, Array],
            default: ' preview searchreplace autolink directionality visualblocks visualchars image link media template code codesample table charmap pagebreak nonbreaking insertdatetime  lists wordcount help emoticons'
        },
        toolbar: {
            type: [String, Array],
            default: ' code preview | blocks fontsize lineheight | forecolor backcolor bold italic underline strikethrough  subscript superscript  removeformat | \
            alignleft aligncenter alignright alignjustify outdent indent | bullist numlist | pagebreak link table  |  image media  filemanage  codesample charmap emoticons'
        },
        'upload': {
          type: String,
          default: 'upload'
        },
    },
    data() {
        return {
            init: {
                language_url: `${this.baseUrl}/static/tinymce/langs/zh-Hans.js`,  //Introduce the language pack file
                language: 'zh-Hans',  //language type
                skin_url: `${this.baseUrl}/static/tinymce/skins/ui/` + (window.darkMode === 'dark' ? 'oxide-dark' : 'oxide'),
                content_css: `${this.baseUrl}/static/tinymce/skins/content/${window.darkMode === 'dark' ? 'dark' : 'default'}/content.min.css`,
                emoticons_database_url: `${this.baseUrl}/static/tinymce/emojis.min.js`,

                plugins: this.plugins,
                toolbar: this.toolbar,
                promotion: false,
                width: '100%',
                min_height: 500,
                font_size_formats: '12px 14px 16px 18px 24px 36px 48px 56px 72px',
                convert_urls: false,
                relative_urls: false,
                line_height_formats: "0.5 0.8 1 1.2 1.5 1.75 2 2.5 3 4 5",
                placeholder: 'Please enter content',
                branding: false,
                resize: false,
                elementpath: false,
                content_style: "img {max-width:100%;}",
                paste_data_images: true,
                images_upload_handler: (blobInfo, success, failure) => {
                    var xhr, formData;
                    xhr = new XMLHttpRequest();
                    xhr.withCredentials = false;
                    xhr.open('POST', getUrl(this.upload));

                    xhr.onload = function () {
                        let json;
                        if (xhr.status !== 200) {
                            failure('HTTP Error: ' + xhr.status)
                            return;
                        }
                        json = JSON.parse(xhr.responseText);
                        if (!json || !json.data.length) {
                            failure('Invalid JSON: ' + xhr.responseText)
                            return;
                        }
                        json.data.map(info => {
                            success(info.url)
                        })
                    };
                    formData = new FormData();
                    formData.append('file', blobInfo.blob(), blobInfo.filename())

                    xhr.setRequestHeader('Accept', 'application/json')
                    xhr.setRequestHeader('Authorization', `${getLocalUserInfo().token || ''}`)
                    xhr.send(formData)
                },
                setup: function (editor) {
                    // file manager
                    editor.ui.registry.getAll().icons.filemanage || editor.ui.registry.addIcon('filemanage', '<svg t="1620982539724" class="icon" viewBox="0 0 1204 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2147" width="22" height="22"><path d="M0.002 541.857c0-124.482 85.64-233.86 200.042-266.246C263.379 115.14 420.248 0 603.747 0c184.938 0 337.488 115.143 400.801 275.61 118.024 33.104 200.053 141.048 200.053 266.248 0 153.998-124.495 279.245-282.07 279.245-29.503 0-56.136-26.62-56.136-56.112 0-33.832 26.62-56.136 56.137-56.136 94.979 0 170.573-74.11 170.573-166.939 0-49.653-22.351-95.71-59.007-125.211l-10.07-9.41c-2.882-3.6-7.2-6.47-12.94-10.07-2.894-3.613-9.41-3.613-12.94-6.483h-3.6c-2.882-3.6-6.482-3.6-9.41-6.47h-3.6c-2.883 0-6.482-3.61-10.082-3.61-2.882 0-6.47 0-6.47-2.87h-9.41c-3.6 0-6.47 0-10.082-3.6h-26.562c-2.882-10.788-6.482-18.705-6.482-29.504-2.87 0-2.87-3.588-2.87-6.47-3.588-6.482-3.588-12.94-6.47-19.434 0-3.6-3.612-3.6-3.612-7.188-2.87-6.47-6.47-12.94-10.058-19.421v-6.482c-2.894-6.47-9.41-12.94-12.94-19.434-55.396-92.156-157.609-154.716-272.764-154.716-118.012 0-220.181 62.56-275.587 154.716l-9.41 19.434c0 2.164-1.448 2.164-2.154 4.317l-1.447 2.165-10.081 19.42v7.2l-9.34 19.435v6.446c-3.612 10.8-7.2 18.716-7.2 29.503H259.05c-2.87 3.6-6.47 3.6-9.34 3.6h-6.494c-2.87 2.164-4.306 2.87-5.035 2.87a1.341 1.341 0 0 1-2.153 0c-2.87 0-6.482 3.61-9.41 3.61h-6.47c-3.611 2.883-6.482 2.883-10.082 6.47h-3.587c-2.87 2.87-6.482 2.87-9.411 6.483h-3.6c-2.87 3.6-6.46 6.47-10.07 10.07-6.47 2.87-9.34 6.482-12.94 9.41-36.69 29.504-55.396 75.56-55.396 125.212 0 92.828 75.559 166.94 166.94 166.94 33.83 0 59.018 22.35 59.018 56.136 0 29.503-25.187 56.112-59.02 56.112C128.098 821.103 0.002 695.856 0.002 541.857zM377.792 728.9c0-16.552 6.47-28.786 12.94-39.573L561.293 502.31c10.8-10.788 25.88-16.552 42.467-16.552s29.504 5.764 43.173 16.552l166.938 187.04a54.972 54.972 0 0 1 16.551 39.573c0 29.503-25.186 55.42-59.006 55.42-16.55 0-28.786-8.636-39.585-19.423l-71.947-78.453v282.105c0 33.82-25.185 55.419-56.136 55.419-32.373 0-55.419-21.586-55.419-55.42V686.504l-71.9 78.44c-10.785 10.788-26.62 19.422-43.16 19.422-29.561 0-55.477-25.915-55.477-55.407z" p-id="2148"></path></svg>');
                    editor.ui.registry.addButton('filemanage', {
                        icon: 'filemanage',
                        tooltip: 'file manager',
                        onAction: function () {
                            window.fileManage({
                                multiple: true
                            }).then(res => {
                                res.map(info => {
                                    let node
                                    switch (info.ext) {
                                        case 'png':
                                        case 'jpg':
                                        case 'jpeg':
                                        case 'bmp':
                                        case 'gif':
                                            node = "<div><img src='" + info.url + "' alt='" + info.title + "' /></div>"
                                            break;
                                        case 'mp4':
                                        case 'ogm':
                                        case 'ogv':
                                        case 'webm':
                                            node = "<div><video controls src='" + info.url + "'></video></div>"
                                            break;
                                        case 'mp3':
                                        case 'ogg':
                                        case 'wav':
                                        case 'acc':
                                            node = "<div><audio controls src='" + info.url + "'></audio></div>"
                                            break;
                                        default:
                                            node = "<div><a href='" + info.url + "' target='_blank'>" + info.title + "</a></div>"
                                    }
                                    editor.insertContent(node)
                                })
                            })
                        }
                    })
                },
                toolbar_mode: 'wrap',
                file_picker_callback: function (callback, value, meta) {
                    let type = 'all';
                    if (meta.filetype == 'media') {
                        type = 'video,audio';
                    }
                    if (meta.filetype == 'image') {
                        type = 'image';
                    }
                    window.fileManage({
                        multiple: false
                    }).then(res => {
                        callback(res.url)
                    })
                },
                file_picker_types: 'file image media',

            },

            html: this.value
        }
    },
    watch: {
        value(content) {
            this.html = content
        },
        content(content) {
            this.$emit('update:value', content)
        },
    },
    created() {
    },
    mounted() {
        tinymce.init({})
    },
    methods: {
        // 添加相关的事件，可用的事件参照文档=> https://github.com/static/tinymce/tinymce-vue => All available events
        onClick(e) {
            this.$emit('onClick', e, tinymce)
        },
        //清空内容
        clear() {
            this.html = ''
        },
    },
    render() {
        return <Editor vModel={this.html} init={this.init} disabled={this.disabled} onClick={this.onClick} />
    }
})
