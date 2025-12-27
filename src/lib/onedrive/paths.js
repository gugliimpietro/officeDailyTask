use strict";

const PathKind = Object.freeze({
  TEMPLATE: "template",
  GENERATED: "generated",
});

function getOnedrivePath({ folderKey, username, pathKind }) {
  if (!folderKey) {
    throw new Error("folderKey is required");
  }

  if (!pathKind) {
    throw new Error("pathKind is required");
  }

  switch (pathKind) {
    case PathKind.TEMPLATE:
      return `aplikasi progres/templates/${folderKey}`;
    case PathKind.GENERATED:
      if (!username) {
        throw new Error("username is required for generated paths");
      }

      return `aplikasi progres/generated/${username}/${folderKey}`;
    default:
      throw new Error(`Unknown pathKind: ${pathKind}`);
  }
}

module.exports = {
  PathKind,
  getOnedrivePath,
};
