import { event } from "./event"

/**
 * preview picture
 * @param {*} images image list
 * @param {*} current current display image
 * @returns
 */
export const imagePreview = (images, current) => {
    event.emit('image-preview-show', {
        images,
        current
    })
}
