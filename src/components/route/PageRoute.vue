<template>
    <template v-if="!uninstall && !errorMessage && currentUrl">
        <component :is="vueComp" v-if="pageType === 'vue'"></component>
        <Create v-if="pageType === 'node'" v-bind="createData"/>
    </template>
    <ErrorPage v-if="errorMessage" :title="errorMessage" :code="errorCode"/>
</template>

<script>
import {defineAsyncComponent} from "vue";
import Hammer from "hammerjs";
import Create from "./Create";
import ErrorPage from "./ErrorPage.vue";
import {getComp, getPage, resource} from "../../utils/router";
import {event} from "../../utils/event";
import {getOffset} from "../../utils/util";

// apply styles
let appStyle;

export default {
    name: "PageRoute",
    props: {
        currentUrl: {
            type: String,
            default: "",
        },
        windowType: {
            type: String,
            default: "page",
        },
        dialogStatus: {
            type: Boolean,
            default: true,
        },
    },
    components: {
        Create,
        ErrorPage,
    },
    data() {
        return {
            // Returned page types node and vue
            pageType: "",
            // Node creation page
            createData: {
                node: [],
            },
            // custom component name
            vueComp: "",
            // page written in html
            htmlComp: "",
            // route change uninstall page
            uninstall: false,
            // page error message
            errorMessage: "",
            // apply styles
            appStyle: null,
        };
    },
    created() {
        this.getPage(this.currentUrl);
        event.add("router-change", this.routeChange);
    },
    beforeUnmount() {
        event.remove("router-change", this.routeChange);
        // unload resource
        resource.uninstall(this.currentUrl);
    },
    watch: {
        currentUrl(url) {
            this.getPage(url);
        },
        dialogStatus() {
            resource.uninstall(this.currentUrl);
        },
    },
    methods: {
        routeChange(data) {
            // Listen for page refresh
            if (
                data.url === this.currentUrl &&
                ["push", "replace"].includes(data.agree)
            ) {
                this.getPage(data.url);
            }
        },
        getPage(url) {
            if (url === "/") {
                return;
            }
            if (this.pageStatus) {
                // cancel the request
                this.pageStatus.abort();
            }
            this.pageStatus = getPage(url, this.windowType);
            this.$emit("load-status", {type: "start"});
            this.pageStatus
                .then(({type, data}) => {
                    this.errorMessage = "";
                    this.pageType = type;
                    this.pageStatus = null;
                    this.shadowRoot;
                    if (type === "vue") {
                        // create vue component
                        return getComp(data, this.currentUrl).then((res) => {
                            this.vueComp = defineAsyncComponent({
                                loader: () => Promise.resolve(res),
                                suspensible: false,
                            });
                            setTimeout(() => {
                                // Execute the rendering success callback
                                res._didCallback();
                            }, 100);
                        });
                    } else if (type === "html") {
                        this.htmlComp = data;
                    } else {
                        this.uninstall = true;
                        // create json component
                        this.createData = data;
                        if (data.static) {
                            resource.pageLoad(data.static, this.currentUrl);
                        }
                    }
                })
                .then(() => {
                    this.$nextTick(() => {
                        this.uninstall = false;
                    });
                    // unload data
                    resource.uninstall(this.oldUrl);
                    this.oldUrl = url;
                    this.$nextTick(() => {
                        setTimeout(() => {
                            const myEvent = new Event("resize");
                            window.dispatchEvent(myEvent);
                        }, 20);

                        this.$emit("load-status", {type: "end"});
                    });
                    // window drag
                    const pageMove = () => {
                        const pos = {
                            start: {x: 0, y: 0},
                            move: {x: 0, y: 0},
                        };
                        const modal = document.querySelector(
                            ".arco-modal-wrapper .arco-modal"
                        );
                        const head = document.querySelector(
                            ".arco-modal-wrapper .arco-modal-header"
                        );
                        if (!head) {
                            return;
                        }
                        const mc = new Hammer.Manager(head);
                        mc.add(
                            new Hammer.Pan({direction: Hammer.DIRECTION_ALL, threshold: 0})
                        );
                        const current = {x: 0, y: 0};
                        const func = (e) => {
                            switch (e.type) {
                                case "panstart":
                                    if (modal.style.transform) {
                                        const [x, y] = modal.style.transform
                                            .match(/\d{1,}px|-\d{1,}px/g)
                                            .map((item) => item.split("px")[0] | 0);
                                        current.x = x;
                                        current.y = y;
                                    }
                                    pos.start = e.center;
                                    pos.move = e.center;
                                    break;
                                case "pan":
                                    pos.move = e.center;
                                    break;
                                case "panend":
                                    pos.move = e.center;
                                    break;
                            }
                            const {top} = getOffset(modal);
                            modal.style.transform = `translate3d(${
                                current.x + pos.move.x - pos.start.x
                            }px, ${Math.max(
                                current.y + pos.move.y - pos.start.y,
                                -top
                            )}px, 0)`;
                        };
                        mc.on("pan panstart panend", func);
                        return () => {
                            mc.off("pan panstart panend", func);
                        };
                    };
                    setTimeout(() => {
                        pageMove();
                    }, 500);
                })
                .catch((err) => {
                    resource.uninstall(this.oldUrl);
                    this.oldUrl = url;
                    if (err.status !== 1) {
                        this.errorCode = err.status;
                        this.errorMessage =
                            err.data?.error?.message || err.message || "Page failed to load";
                        this.$emit("load-status", {type: "error"});
                        this.pageStatus = null;
                    }
                });
        },
    },
};
</script>
