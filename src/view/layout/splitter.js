import {View as ItemView} from "../item.js";
import {types} from "../../types/index.js";
import style from "./splitter.css";

export class Splitter extends ItemView {
    static options = {
        orientation: {type: types.primitives.String, default: "horizontal"}
    };

    static events = {onResize: true};

    constructor(options) {
        const $container = options.$container;

        super(options);

        // TODO. This should be done in markup method
        // TODO. It's better to call them $panes
        const $elements = $container.children();

        //TODO. It's better to make boolean 'is_vertical' default=false
        const isVertical = this._options.orientation === "vertical";

        //TODO. Do we really need this check?
        if ($elements.length < 2) {
            throw new Error("Container must contain at least two elements.");
        }

        $container.empty();
        //TODO. It's better not to use - in class name to be able to work with standard js keys style.e_splitter
        const innerContainer = $(`<div class="${style["e-splitter"]}" style="height: ${this._options.height}; width: ${this._options.width};"></div>`);

        if (isVertical) {
            innerContainer.addClass(style["e-splitter-vertical"]);
        } else {
            innerContainer.addClass(style["e-splitter-horizontal"]);
        }

        innerContainer.appendTo($container);
        
        const $handles = [];

        const $items = [];

        // TODO. What for?
        let orderN = 0;

        const orientation = this._options.orientation;

        // TODO. Do we really need this function? What does it do?
        function getInitialFlexBasis(value, paneLength) {
            let initialFlexBasis = (value - (8 * paneLength - 1)) / paneLength;
            initialFlexBasis = ((initialFlexBasis / value) + ((8 / paneLength) / value)) * 100;
            return {initialFlexBasis, value};
        }
        
        const paneLength = $elements.length;

        let {initialFlexBasis, value: containerValue} = getInitialFlexBasis(isVertical ? innerContainer.height() : innerContainer.width(), paneLength);

        $elements.each(function(index, $element) {
           
            $element = $($element);

            if (orderN > 0) { orderN += 1; }
            
            const paneShell = $(`<div class="${style["e-pane"]} ${style["e-pane-horizontal"]}"></div>`);

            // TODO. Why do we need order?
            const paneStyle = {"order": orderN + ""};

            if (index + 1 !== $elements.length) {
                // paneStyle['flex-basis'] = `${initialFlexBasis}%`;
                paneShell.addClass(style["e-static-pane"]);
            }

            paneShell.css(paneStyle);

            $element.appendTo(paneShell);

            orderN += 1;

            $items.push(paneShell);

            // TODO. Next should be done with in if (index + 1 !== $elements.length)
            // TODO. What for do we need attributes
            //                 tabindex="0"
            //                 role="separator"
            //                 aria-orientation="${orientation}"
            const $handle = $(`<div 
                class="${style.splitbar} ${isVertical ? style.vertical : style.horizontal}" 
                style="order: ${orderN}" 
                tabindex="0" 
                role="separator"    
                aria-orientation="${orientation}">
                <div class="${isVertical ? style.handle_v : style.handle_h}"></div>
            </div>`);

            if (index + 1 !== $elements.length) { 
                $handle.insertAfter($element);  // TODO. No sense in it
                $handles.push($handle);
                $items.push($handle);
            } 
        });

        $items.forEach(i => $(i).appendTo(innerContainer));

        const _this = this;

        $handles.forEach(function(item, idx) {
            const leftSide = item.prev();
            const rightSide = item.next();

            let coords;

            item.on("mousedown", mouseDownHandler);

            function mouseDownHandler(e) {
                // leftSide.width() doesnt return correct width i.e 48px instead of 0px

                const {width: firstWidth, height: firstHeight} = leftSide[0].getBoundingClientRect();
                const {width: secondWidth, height: secondHeight} = rightSide[0].getBoundingClientRect();

                coords = {
                    e,
                    prev:{ width, height },
                    next:{width, height}
                    firstWidth,
                    secondWidth,
                    firstHeight,
                    secondHeight
                };

                // TODO. May be better to use ? operator here?
                containerValue = innerContainer.width();

                if (isVertical) {
                    containerValue = innerContainer.height();
                }

                item.addClass(style.resizing);
              
                document.addEventListener("mousemove", mouseMoveHandler);
                document.addEventListener("mouseup", () => {
                    mouseUpHandler();
                    _this._trigger("onResize", [true]);
                });
            }

            function mouseMoveHandler(e) {
                const delta = {
                    width: e.clientX - coords.e.clientX,
                    height: e.clientY - coords.e.clientY
                };

                const styles = {};

                const dimension = isVertical ? 'height' : 'width';

                if (isVertical) {


                    delta.x = Math.min(Math.max(delta[dimension], -coords.prev[dimension]), coords.next[dimension]);

                    styles.left = {"flex-basis": ((coords.next[dimension] + delta.x )* 100) / containerValue + "%"};

                    if (idx !== $handles.length - 1) {
                        styles.right = {
                            "flex-basis": ((coords.secondHeight - delta.x) * 100) / containerValue + "%"
                        };
                    }

                } else {
                    delta.x = Math.min(Math.max(delta.x, -coords.firstWidth), coords.secondWidth);

                    styles.left = {"flex-basis": ((coords.firstWidth + delta.x )* 100) / containerValue + "%"};

                    if (idx !== $handles.length - 1) {
                        styles.right = {
                            "flex-basis": ((coords.secondWidth - delta.x) * 100) / containerValue + "%"
                        };
                    }
                }

                leftSide.css(styles.left);
                rightSide.css(styles?.right || {});
                              
            }

            function mouseUpHandler() {
                item.removeClass(style.resizing);
                document.removeEventListener("mousemove", mouseMoveHandler);
                document.removeEventListener("mouseup", mouseUpHandler);
            }
        });

    }
}

Splitter.extend();