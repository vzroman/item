import {item} from "../index.js"
import icon from "./error.svg"
import styles from "./error.css"

export function error( error ){
    const $error = $(`<div class="${ styles.error }"></div>`);
    $error.html(error);
    return new Promise(resolve =>{
        new item.view.layout.Window({
            title:item.i18n.text("ERROR")+"!",
            icon:`url("${ icon }")`,
            actions:["close"],
            classes:[styles.error_window],
            view:{
                view:item.view.primitives.Html,
                options:{ html:$error }
            },
            events:{ destroy:resolve }
        });
    })
}