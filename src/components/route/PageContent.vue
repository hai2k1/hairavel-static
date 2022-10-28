<template>
    <template v-if="windowType === 'page'">
        <PageRoute
            :windowType="windowType"
            :currentUrl="url"
            @load-status="loadStatus"
        />
    </template>

    <a-modal
        v-else-if="mode === 'modal'"
        v-model:visible="dialogShow"
        modalClass="page-dialog max-w-2xl w-full"
        :closable="false"
        :mask="true"
        :footer="false"
        :alignCenter="false"
        @before-close="dialogClose"
    >
        <div ref="dialogAnimation" class="dialog-animation">
            <PageRoute
                :windowType="windowType"
                :currentUrl="url"
                @load-status="loadStatus"
                :dialog-status="dialogStatus"
            />
        </div>
    </a-modal>

    <a-drawer
        v-else
        v-model:visible="dialogShow"
        class="page-drawer"
        :mask="true"
        :footer="false"
        :width="350"
        @before-close="dialogClose"
        @cancel="
      () => {
        this.changeRouter('', 'back');
      }
    "
    >
        <div ref="dialogAnimation" class="dialog-animation">
            <PageRoute
                :windowType="windowType"
                :currentUrl="url"
                @load-status="loadStatus"
                :dialog-status="dialogStatus"
            />
        </div>
    </a-drawer>
</template>

<script>
import PageRoute from "./PageRoute.vue";
import { router } from "../../utils/router";

export default {
    name: "PageContent",
    props: {
        currentUrl: {
            type: String,
            default: "",
        },
        windowType: String,
        mode: {
            type: String,
            default: "modal",
        },
    },
    components: {
        PageRoute,
    },
    data() {
        return {
            url: "",
            // Record the routing history in the window
            urls: [],
            // popup loading message
            dialogMsg: null,
            dialogShow: false,
            dialogStatus: true,
        };
    },
    watch: {
        currentUrl(url) {
            // Only the page page needs to listen for route changes
            if (this.windowType === "page") {
                this.url = url;
            }
        },
    },
    created() {
        this.url = this.currentUrl;
        this.urls.push(this.currentUrl);
    },
    mounted() {
        // this.dialogShow = true;
    },
    methods: {
        closeWindow() {
            if (this.dialogShow) {
                this.dialogShow = false;
                setTimeout(() => {
                    this.$emit("close-dialog");
                }, 200);
            } else {
                this.$emit("close-dialog");
            }
        },
        changeRouter(url, type) {
            if (this.windowType === "page") {
                // change the routing address
                router[type](url);
            } else {
                if (type === "push") {
                    this.urls.push(url);
                    // only change the current routing address
                    this.url = url;
                } else if (type === "replace") {
                    // only change the current routing address
                    this.url = url;
                } else if (type === "back") {
                    const num = url | 0 || 1;
                    if (num >= this.urls.length) {
                        // close the window
                        this.closeWindow();
                    } else {
                        // go back to the page
                        this.urls.splice(this.urls.length - num);
                        this.url = this.urls[this.urls.length - 1];
                    }
                }
            }
        },
        closeLoading() {
            this.dialogMsg?.close?.();
            this.dialogMsg = null;
        },
        loadStatus({ type }) {
            if (this.windowType === "page") {
                if (type === "start") {
                    window.NProgress.start();
                } else {
                    this.pageAnimation();
                    window.NProgress.done();
                }
            } else {
                if (type === "start") {
                    this.dialogMsg = window.message.info("Loading page, please wait...");
                } else if (type === "end") {
                    setTimeout(() => {
                        this.dialogShow = true;
                        this.closeLoading();
                    }, 500);
                } else {
                    setTimeout(() => {
                        this.dialogShow = true;
                        this.closeLoading();
                    }, 500);
                    if (this.urls.length === 1) {
                        this.closeWindow();
                    }
                }
            }
        },
        pageAnimation() {
            /**
             * Execute the animation if the load is successful or if the load fails
             */
            const page = document.getElementById("page-animation");
            page.classList.add("an-start");

            setTimeout(() => {
                page.classList.remove("an-start");
            }, 5);
        },
        dialogAnimation() {
            /**
             * Execute the animation if the load is successful or if the load fails
             */
            const page = this.$refs.dialogAnimation.$el;
            page.classList.add("an-start");

            setTimeout(() => {
                page.classList.remove("an-start");
            }, 5);
        },
        dialogClose() {
            this.dialogStatus = false;
        },
    },
};
</script>

<style>
.dialog-animation {
    transition: all 0.2s;
}

.dialog-animation.an-start {
    transition: all 0s;
    opacity: 0;
    transform: scale3d(0.4, 0.4, 1);
}

.page-dialog .arco-modal-body {
    padding: 0;
}

.page-drawer {
}

.page-drawer .arco-drawer-header {
    display: none;
}

.page-drawer .arco-drawer-body {
    padding: 0;
}
</style>
