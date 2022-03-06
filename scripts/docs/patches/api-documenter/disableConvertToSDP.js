const { YamlDocumenter } = require("@microsoft/api-documenter/lib/documenters/YamlDocumenter");

YamlDocumenter.prototype.generateFiles = function (outputFolder) {
    console.log();
    this._deleteOldOutputFiles(outputFolder);
    for (const apiPackage of this._apiModel.packages) {
        console.log(`Writing ${apiPackage.name} package`);
        this._visitApiItems(outputFolder, apiPackage, undefined);
    }

    this._writeTocFile(outputFolder, this._apiModel.packages);
};
