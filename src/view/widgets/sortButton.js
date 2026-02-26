
import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import {controls} from "../controls/index.js";
import {waiting} from "../../utilities/waiting.js";
import styles from "./sortButton.css";
import UpIcon from "../../../src/img/triangle_up.svg";
import DownIcon from "../../../src/img/triangle_down.svg";

const ICON_ASC = `url("${UpIcon}")`;
const ICON_DESC = `url("${DownIcon}")`;

export class SortButton extends ItemView {

    static events= {
        sort: true
    }

    static options = {
        sortField: { type: types.primitives.String, required: true },
        direction: { type: types.primitives.String },
        text: { type: types.primitives.String }
    };

    static markup = `<div class="${styles.sortButton} item_sort_button">
        <div name="button"></div>
        <span name="icon" class="${styles.icon}"></span>
    </div>`;

    widgets() {
        return {
            button: {
                view: controls.Button,
                options: {
                    links: {
                        text: { source: "parent", event: "text" }
                    }
                }
            }
        };
    }

    constructor(options) {
        super(options);

        const $icon = this.$markup.children('[name="icon"]');

        this.bind("direction", direction => {
            let icon;
            if(direction === "asc") {
                icon= ICON_ASC;
                this.$markup.attr("data-sort", "asc");
            }else{
                icon = ICON_DESC;
                this.$markup.attr("data-sort", "desc");
            }
            $icon.css("background-image", icon);
        });

        this.$markup.on("click", (e) => {
            e.stopPropagation();
            const current = this.get("direction");
            const next = current === "asc" ? "desc" : "asc";
            this.set({ direction: next });
            this._trigger("sort", [this.get("sortField"), next]);
        });

    }

    focus() {
        this._widgets.button.focus();
    }


    link(context){
        super.link(context);
        
        if(context.data){
            let unlock = null;
            context.data.bind("loading", (isLoading) => {
                if(isLoading && !unlock){
                    unlock = waiting(this.$markup, { backgroundSize: "contain" });
                }else if(!isLoading && unlock){
                    unlock();
                    unlock = null;
                }
            })
        }
    }
}
SortButton.extend();
