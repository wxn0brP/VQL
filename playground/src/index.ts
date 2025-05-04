import { inputArea, toFormatSelect, outputArea, runButton, fromFormatSelect, errorsDiv } from "./html";
import { guessParser, parseStringQuery, VQLParserMode } from "#cpu";
import { generateKeyValues, op, standardizeVQLR } from "./to";
import yaml from "js-yaml";
import json5 from "json5";
import { VQLR } from "#src/types/vql";

function detectFormat (input: string): VQLParserMode {
    if (input.startsWith("{")) return "VQLR";
    return guessParser(input).mode;
}

function run () {
    const input = inputArea.value;
    const toFormat = toFormatSelect.value;
    let fromFormat = fromFormatSelect.value;

    if (fromFormat === "auto") {
        fromFormat = detectFormat(input);
    }

    let vqlr = fromFormat === "VQLR" ? JSON.parse(input) : parseStringQuery(input) as VQLR;
    if (toFormat === "VQLR") {
        outputArea.value = JSON.stringify(vqlr, null, 2);
        return;
    }

    let output = "";
    output += op(vqlr) + "\n";
    vqlr = standardizeVQLR(vqlr);

    if (toFormat === "VQLM") output += yaml.dump(vqlr);
    else if (toFormat === "VQLB") output += json5.stringify(vqlr, null, 2);
    else if (toFormat === "VQLS") output += generateKeyValues(vqlr).join("\n");

    outputArea.value = output; 
}

runButton.addEventListener("click", () => {
    try {
        errorsDiv.innerHTML = "";
        run();
    } catch (e) {
        console.error(e);
        errorsDiv.innerHTML = e.message;
    }
});