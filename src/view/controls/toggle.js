
import {Control} from "./control";
import {types} from "../../types";
import styles from "./toggle.css";

export class Toggle extends Control {
    static options = {
        value: { type: types.primitives.Bool, default: false },
        textOn: { type: types.primitives.String, default: "on" },
        textOff: { type: types.primitives.String, default: "off" },
    };

    static markup = `<label class="${styles["toggle"]} ${styles["toggle-lg"]}">
        <input name="toggle-input" type="checkbox" class="${styles["toggle-input"]}" aria-label="Close" aria-checked="false" role="switch">
        <span class="${styles["toggle-presentation"]}">
            <span name="inner-text" class="${styles["toggle-inner"]}"></span>
        </span>
    </label>`;

    constructor(options) {
        super(options);

        this.$switch = this.$markup.find('[name="toggle-input"]');

        const $innerText = this.$markup.find('[name="inner-text"]');

        this.bind("textOn", (val) => {
            if (this.get("value")) { $innerText.text(val); }
        });

        this.bind("textOff", (val) => {
            if (!this.get("value")) { $innerText.text(val); }
        });

        ["mousedown", "mouseup", "click"].forEach((event) =>
            this.$switch.on(event, (e) => { e.stopPropagation(); })
        );

        this.$switch.on("change", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.set({ value: this.$switch.prop("checked") });
        });

        this.bind("value", (val) => {
            this.$markup.toggleClass(styles["toggle-checked"], val);
            this.$switch.attr("aria-label", val ? "Open" : "Close");
            this.$switch.attr("aria-checked", val ? "true" : "false");
            
            $innerText.text(val ? this._options.textOn : this._options.textOff);
        });
    }

    updateValue(value = false, prev) {
        this.$switch.prop("checked", value);
    }

    enable(value) {
        this.$switch.prop("disabled", !value);
    }

    focus() {
        this.$switch.focus();
    }
}
Toggle.extend();
