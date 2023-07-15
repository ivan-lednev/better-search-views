import { Instance, ReferenceElement } from "tippy.js";
import SNWPlugin from "../../main";
import { mountContextTree } from "./mount-context-tree";

export const mountHoverView = async (instance: Instance, plugin: SNWPlugin) => {
  const { refType, key, filePath } = await getDataElements(
    instance
  );
  const popoverEl = createDiv();
  popoverEl.addClass("snw-popover-container");

  await mountContextTree({
    refProps: { refType, filePath, key },
    plugin,
    el: popoverEl,
  });

  instance.setContent(popoverEl);
};

/**
 * Utility function to extact key data points from the Tippy instance
 *
 * @param {Instance} instance
 * @return {*}  {Promise<{refType: string; key: string; filePath: string}>}
 */
const getDataElements = async (
  instance: Instance
): Promise<{
  refType: string;
  realLink: string;
  key: string;
  filePath: string;
  lineNu: number;
}> => {
  const parentElement: ReferenceElement = instance.reference;
  const refType = parentElement.getAttribute("data-snw-type");
  const realLink = parentElement.getAttribute("data-snw-reallink");
  const key = parentElement.getAttribute("data-snw-key");
  const path = parentElement.getAttribute("data-snw-filepath");
  const lineNum = Number(parentElement.getAttribute("snw-data-line-number"));
  return {
    refType: refType,
    realLink: realLink,
    key: key,
    filePath: path,
    lineNu: lineNum,
  };
};
