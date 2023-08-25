import {Control} from "./control";
import {types} from "../../types";
import styles from "./toggle.css";

export class Toggle extends Control {
    static options = {
        value: { type: types.primitives.Bool, default: false },
        textOn: { type: types.primitives.String, default: "on" },
        textOff: { type: types.primitives.String, default: "off" },
    };

    static markup = `<button type="button" role="switch" aria-checked="false" class="${styles["toggle"]}">
        <div class="${styles["toggle-handle"]}"></div>
        <span class="${styles["toggle-inner"]}">
            <span name="on" class="${styles["toggle-inner-checked"]}"></span>
            <span name="off" class="${styles["toggle-inner-unchecked"]}"></span>
        </span>
    </button>`;

    constructor(options) {
        super(options);

        const $on = this.$markup.find('[name="on"]');
        const $off = this.$markup.find('[name="off"]');

        this.bind("textOn", (val) => { $on.text(val); });
        this.bind("textOff", (val) => { $off.text(val); });

        ["mousedown", "mouseup"].forEach((event) => {
            this.$markup.on(event, (e) => { e.stopPropagation(); });
        });

        this.$markup.on("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.set({ value: !this.get("value") });
        });

        this.bind("value", (val) => {
            this.$markup.toggleClass(styles["toggle-checked"], val);
            this.$markup.attr("aria-checked", val ? "true" : "false");
        });
    }

    updateValue(value = false, prev) {
        this.$markup.attr("aria-checked", value);
    }

    enable(value) {
        this.$markup.prop("disabled", !value);
    }

    focus() {
        this.$markup.focus();
    }
}
Toggle.extend();
