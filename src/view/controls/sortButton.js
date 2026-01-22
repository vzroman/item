
import {Control as Parent} from "./control.js";
import {types} from "../../types/index.js";
import styles from "./sortButton.css";
import UpIcon from "../../../src/img/arrow_up.svg";
import DownIcon from "../../../src/img/arrow_down.svg";

const ICON_ASC = `url("${UpIcon}")`;
const ICON_DESC = `url("${DownIcon}")`;

export class SortButton extends Parent {

    static options = {
        sortField: { type: types.primitives.String, required: true },
        direction: { type: types.primitives.String },
        text: { type: types.primitives.String }
    };

    static events = {
        sort: true
    };

    static markup = `<button class="${styles.sortButton} item_sort_button">
        <span name="text" class="${styles.text}"></span>
        <span name="icon" class="${styles.icon}"></span>
    </button>`;

    constructor(options) {
        super(options);

        const $text = this.$markup.find('[name="text"]');
        const $icon = this.$markup.find('[name="icon"]');

        this.bind("text", value => $text.text(value));

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
            this.$markup.trigger("item-sort", [this.get("sortField"), next]);
        });
        
    }

    enable(value) {
        this.$markup.prop('disabled', !value);
    }

    focus() {
        this.$markup.focus();
    }
}
SortButton.extend();