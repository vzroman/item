
import {Control} from "./control";
import {types} from "../../types";
import styles from "./toggle.css";

export class Toggle extends Control{

    static options = {
        value:{type: types.primitives.Bool, default:false},
        textOn: {type: types.primitives.String, default:"on"},
        textOff: {type: types.primitives.String, default:"off"}
    };

    static markup = `<label class="${ styles.switch }">
        <input name="switch-input" class="${ styles.toggle_input }" type="checkbox">
        <span class="${ styles.slider } ${ styles.round }"></span>
        <span name="switch-on" class="${styles["switch_text-on"]}"></span>
        <span name="switch-off" class="${styles["switch_text-off"]}"></span>
    </label>`;

    constructor( options ){
        super( options );

        this.$switch = this.$markup.find('[name="switch-input"]');
        const $on = this.$markup.find('[name="switch-on"]');
        const $off = this.$markup.find('[name="switch-off"]');

        this.bind("textOn", val=> $on.text( val ) );
        this.bind("textOff", val=> $off.text( val ) );

        ["mousedown","mouseup","click"].forEach(event => this.$switch.on(event, e=>{
            e.stopPropagation();
        }));

        this.$switch.on("change", e=>{
            e.preventDefault();
            e.stopPropagation();
            this.set({ value: this.$switch.prop('checked')});
        });

        this.bind("value", val => {
            this.$markup.toggleClass(styles.on, val);
        })
    }

    updateValue( value=false, prev ){
        this.$switch.prop('checked', value);
    }

    enable( value ){
        this.$switch.prop('disabled', !value);
    }

    focus(){
        this.$switch.focus();
    }
}
Toggle.extend();
