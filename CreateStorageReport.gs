// https://webapps.stackexchange.com/questions/49122/how-to-view-the-folder-size-in-google-drive
doGet();

function doGet() {
  var progressFileCompletedFound = DriveApp.getRootFolder().searchFiles(
    "title contains 'Folder Sizes Report Completed'"
  );
  if (progressFileCompletedFound.hasNext()) {
    return ContentService.createTextOutput(
      "Report file was already created in your Drive's root folder, exiting."
    );
  }
  CreateReportFile();
  DriveApp.createFile(
    "Folder Sizes Report Completed.txt",
    "You may safely delete this file."
  );
  return ContentService.createTextOutput(
    "Report file created in your Drive's root folder"
  );
}

function CreateReportFile() {
  var reportContent = CreateReport();
  DriveApp.createFile("Folder Sizes Report.txt", reportContent);
}

function CreateReport() {
  var reportContent = "";
  var progressFileFound = DriveApp.getRootFolder().searchFiles(
    "title contains 'Getting Folder Sizes,'"
  );
  var progressFile;
  var report = [];
  if (progressFileFound.hasNext()) {
    progressFile = progressFileFound.next();
    var json = progressFile.getBlob().getDataAsString();
    try {
      report = JSON.parse(json);
    } catch (Exception) {
      DriveApp.removeFile(progressFile);
      progressFile = DriveApp.createFile(
        "Getting Folder Sizes, 0 processed...",
        " "
      );
    }
  } else {
    progressFile = DriveApp.createFile(
      "Getting Folder Sizes, 0 processed...",
      " "
    );
  }
  var f = DriveApp.getRootFolder();
  AddFolderToReport(report, f, "/", progressFile);
  DriveApp.removeFile(progressFile);
  reportContent += "TotalSize MB   FilesSize MB   Path \r\n";
  for (var i = 0; i < report.length; i++)
    reportContent +=
      Utilities.formatString("%12.2f ", report[i].totalSize / (1024 * 1024)) +
      Utilities.formatString(
        "%11.2f      ",
        report[i].filesSize / (1024 * 1024)
      ) +
      report[i].folderPath +
      "\r\n";
  return reportContent;
}

function AddFolderToReport(report, currentFolder, currentPath, progressFile) {
  var report1 = [];
  for (var i = 0; i < report.length; i++)
    if (report[i].folderPath == currentPath) return report[i].totalSize;

  var fChildren = currentFolder.getFolders();
  var totalSize = 0;
  while (fChildren.hasNext() && currentPath.length < 2000) {
    var nextF = fChildren.next();
    totalSize += AddFolderToReport(
      report,
      nextF,
      currentPath + nextF.getName() + "/",
      progressFile
    );
  }
  var filesSize = 0;
  var files = currentFolder.getFiles();
  while (files.hasNext()) {
    filesSize += files.next().getSize();
  }
  totalSize += filesSize;
  report.push({
    folderPath: currentPath,
    filesSize: filesSize,
    totalSize: totalSize,
  });
  progressFile.setName(
    "Getting Folder Sizes, " + report.length + " processed..."
  );
  progressFile.setContent(JSON.stringify(report));
  return totalSize;
}
