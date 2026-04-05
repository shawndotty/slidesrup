var __create = Object.create;
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b ||= {})
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/__tests__/test.ts
var module2 = __toESM(require("module"));
var import_assert = __toESM(require("assert"));

// src/lang/helpers.ts
var import_obsidian2 = require("obsidian");

// src/utils/index.ts
var import_obsidian = require("obsidian");
function getAppInstance() {
  if (typeof window !== "undefined" && window.obsidianApp) {
    return window.obsidianApp;
  } else if (typeof window !== "undefined" && window.app) {
    return window.app;
  } else {
    throw new Error(
      "\u65E0\u6CD5\u83B7\u53D6 Obsidian App \u5B9E\u4F8B\uFF1Awindow.obsidianApp \u548C window.app \u5747\u672A\u5B9A\u4E49"
    );
  }
}

// src/lang/locale/en.ts
var en_default = {
  LicensePurchaseInfo: "You need to purchase a license to use all the features of SlidesRup. Please contact the author for more information. ",
  AuthorWechatID: "Author Wechat ID: johnnylearns",
  "You must provide an API Key to run this command": "You must provide an API Key to run this command",
  "You need to provide the email for your account to run this command": "You need to provide the email for your account to run this command",
  "Get The Latest Version Of Sync Scripts": "Get The Latest Version Of Sync Scripts",
  "Get The Latest Version Of Demo Sync Templates": "Get The Latest Version Of Demo Sync Templates",
  "No active editor, can't excute this command.": "No active editor, can't excute this command.",
  "Get Your Personal Sync Templates": "Get Your Personal Sync Templates",
  "Main Setting": "Main Setting",
  "Sync Scripts Update API Key": "Sync Scripts Update API Key",
  "Please enter a valid update API Key": "Please enter a valid update API Key",
  "Enter the API Key": "Enter the API Key",
  "Sync Scripts Folder": "Sync Scripts Folder",
  "Please enter the path to the Templater Scripts Folder": "Please enter the path to the Templater Scripts Folder",
  "Enter the full path to the Templater Scripts folder": "Enter the full path to the Templater Scripts folder",
  "Demo Sync templates Folder": "Demo Sync templates Folder",
  "Please enter the path to the demo sync templates folder": "Please enter the path to the demo sync templates folder",
  "Enter the path to the demo sync templates folder": "Enter the path to the demo sync templates folder",
  "User Templates Setting": "User Templates Setting",
  "Your Airtable Personal Token": "Your Airtable Personal Token",
  "Please enter your personal Aritable token for your sync setting base": "Please enter your personal Aritable token for your sync setting base",
  "Enter your personal Airtble token": "Enter your personal Airtble token",
  "Your Sync Setting Base ID": "Your Sync Setting Base ID",
  "Please enter the base id of your sync setting base": "Please enter the base id of your sync setting base",
  "Enter the base id": "Enter the base id",
  "Your Sync Setting Table ID": "Your Sync Setting Table ID",
  "Please enter the table id of your sync setting table": "Please enter the table id of your sync setting table",
  "Enter the table id": "Enter the table id",
  "Your Sync Setting view ID": "Your Sync Setting view ID",
  "Please enter the view id of your sync setting table": "Please enter the view id of your sync setting table",
  "Enter the view id": "Enter the view id",
  "Your Sync Templates Folder": "Your Sync Templates Folder",
  "Please enter the path to your sync templates folder": "Please enter the path to your sync templates folder",
  "Enter the path to your sync templates folder": "Enter the path to your sync templates folder",
  "Updating, plese wait for a moment": "Updating, plese wait for a moment",
  "Your API Key was expired. Please get a new one.": "Your API Key was expired. Please get a new one.",
  div: "div",
  Got: "Got",
  records: "records",
  "Getting Data \u2026\u2026": "Getting Data \u2026\u2026",
  "There are": "There are",
  "files needed to be updated or created.": "files needed to be updated or created.",
  "Failed to write file: ": "Failed to write file: ",
  "files needed to be processed.": "files needed to be processed.",
  "All Finished.": "All Finished.",
  "Your Sync Setting URL": "Your Sync Setting URL",
  "Please enter the url of your sync setting table": "Please enter the url of your sync setting table",
  "Enter the url": "Enter the url",
  "Your Email Address": "Your Email Address",
  "Please enter the email you provided when you purchase this product": "Please enter the email you provided when you purchase this product",
  "Enter your email": "Enter your email",
  "When you use the sync with online database feature of IOTO, the sync configration generater I built could help you a lot.": "When you use the sync with online database feature of IOTO, the sync configration generater I built could help you a lot.",
  "You can use the following link to open the shared base and save it to your own Airtable workspace.": "You can use the following link to open the shared base and save it to your own Airtable workspace.",
  "Sync Configration Generator": "Sync Configration Generator",
  "You can watch the follow video to find out how to use this sync configration base.": "You can watch the follow video to find out how to use this sync configration base.",
  "How to use the sync configration generator": "How to use the sync configration generator",
  "In order to help you to learn how to use the sync with online database feature, I will keep posting instructions and videos to the following link.": "In order to help you to learn how to use the sync with online database feature, I will keep posting instructions and videos to the following link.",
  "OB Sync With MDB How To Guide": "OB Sync With MDB How To Guide",
  "Validating...": "Validating...",
  "Valid API Key": "Valid API Key",
  "Valid Email": "Valid Email",
  "SlidesRup Update API Key": "SlidesRup Update API Key",
  "SlidesRup Framework Folder": "SlidesRup Framework Folder",
  "SlidesRup Framework Folder Description": "SlidesRup Framework Folder Description",
  "Get The Latest Version Of Style": "Get The Latest Version Of Style",
  "Get The Latest Version Of Templates": "Get The Latest Version Of Templates",
  "Get The Latest Version Of User Templates": "Get The Latest Version Of User Templates",
  "One Click to Deploy": "One Click to Deploy",
  "Please enter the path to the SlidesRup Framework Folder": "Please enter the path to the SlidesRup Framework Folder",
  "Enter the full path to the SlidesRup Framework folder": "Enter the full path to the SlidesRup Framework folder",
  "Create New Slides": "Create New Slides",
  "Slide Design A": "Slide Design A",
  "Slide Design B": "Slide Design B",
  "Slide Design C": "Slide Design C",
  "Slide Design D": "Slide Design D",
  "Slide Design E": "Slide Design E",
  "Slide Design F": "Slide Design F",
  "Slide Design G": "Slide Design G",
  "Slide Design H": "Slide Design H",
  "Slide Design": "Slide Design",
  "Please select a slide design": "Please select a slide design",
  "New Slide": "New Slide",
  "Untitled Slide": "Untitled Slide",
  "Current Folder": "Current Folder",
  "User Assigned Folder": "User Assigned Folder",
  "Select Location": "Select Location",
  "Default New Slide Location": "Default New Slide Location",
  "Please enter the path to the default new slide location": "Please enter the path to the default new slide location",
  "Enter the full path to the default new slide location": "Enter the full path to the default new slide location",
  "New Slide Location Option": "New Slide Location Option",
  "Please select the default new slide location option": "Please select the default new slide location option",
  "Decide At Creation": "Decide At Creation",
  Cover: "Cover",
  Chapter: "Chapter",
  TOC: "TOC",
  BackCover: "BackCover",
  BaseLayout: "BaseLayout",
  SubSlide: "SubSlide",
  List: "List",
  SubList: "SubList",
  "Use SlidesRup to Express Yourself": "Use SlidesRup to Express Yourself",
  Farewell: "Farewell",
  "Content is the king": "Content is the king",
  "Keep is simple and powerful": "Keep is simple and powerful",
  "Focus on the basic first": "Focus on the basic first",
  "Operation cancelled by user": "Operation cancelled by user",
  "Starting one-click deployment...": "Starting one-click deployment...",
  "Styles updated.": "Styles updated.",
  "Templates updated.": "Templates updated.",
  "Demo slides updated.": "Demo slides updated.",
  "One-click deployment finished!": "One-click deployment finished!",
  "Default Design": "Default Design",
  "Please select your default design": "Please select your default design",
  None: "None",
  "No active editor. Please open a file to add a slide.": "No active editor. Please open a file to add a slide.",
  "Add Slide Partial": "Add Slide Partial",
  Valid: "Valid",
  "Add Chapter": "Add Chapter",
  "Add Page": "Add Page",
  "User Templates Folder": "User Templates Folder",
  "Please enter the path to your own templates": "Please enter the path to your own templates",
  "Choose your templates folder": "Choose your templates folder",
  "User Slide Template": "User Slide Template",
  "Please choose your personal slide template": "Please choose your personal slide template",
  "Choose your personal slide template": "Choose your personal slide template",
  "User Chapter Template": "User Chapter Template",
  "Please choose your personal chapter template": "Please choose your personal chapter template",
  "Choose your personal chapter template": "Choose your personal chapter template",
  "User Page Template": "User Page Template",
  "Please choose your personal page template": "Please choose your personal page template",
  "Choose your personal page template": "Choose your personal page template",
  "User Base Layout Template": "User Base Layout Template",
  "Please choose your personal base layout template": "Please choose your personal base layout template",
  "Choose your personal base layout template": "Choose your personal base layout template",
  "Color Setting": "Color Setting",
  Hue: "Hue",
  Saturation: "Saturation",
  Lightness: "Lightness",
  "Preview Your Slide Theme Color": "Preview Your Slide Theme Color",
  "Adjust the hue of the theme": "Adjust the hue of the theme",
  "Adjust the saturation of the theme": "Adjust the saturation of the theme",
  "Adjust the lightness of the theme": "Adjust the lightness of the theme",
  "Get The Latest Version SlidesRup Reveal Addons": "Get The Latest Version SlidesRup Reveal Addons",
  "Reveal template updated.": "Reveal template updated.",
  "User TOC Template": "User TOC Template",
  "Please choose your personal TOC template": "Please choose your personal TOC template",
  "Choose your personal TOC template": "Choose your personal TOC template",
  Slide: "Slide",
  Confirm: "Confirm",
  Cancel: "Cancel",
  "Please input slide name": "Please input slide name",
  "Please input slide folder name": "Please input slide folder name",
  "Customize Slide Folder Name": "Customize Slide Folder Name",
  "Use Customize Slide Folder Name": "Use Customize Slide Folder Name",
  "Keep is simple but elegant": "Keep is simple but elegant",
  "Slide Settings": "Slide Settings",
  Tagline: "Logo or Tagline",
  "Set Tagline": "Set Logo or Tagline",
  "Your Tagline": "Your Logo or Tagline",
  Slogan: "Slogan",
  "Set Slogan": "Set Slogan",
  "Your Slogan": "Your Slogan",
  Presenter: "Presenter",
  "Set Presenter": "Set Presenter",
  "Date Format": "Date Format",
  "Set Date Format": "Set Date Format",
  "Your Date Format": "Your Date Format",
  "Please input chapter index number": "Please input chapter index number",
  "Please input chapter name": "Please input chapter name",
  "Please input page index number": "Please input page index number",
  "Add Sub Pages When Add Chapter": "Add Sub Pages When Add Chapter",
  "User Chapter With Sub Pages Template": "User Chapter With Sub Pages Template",
  "Please choose your personal chapter with sub pages template": "Please choose your personal chapter with sub pages template",
  "Choose your personal chapter with sub pages template": "Choose your personal chapter with sub pages template",
  "Enable User Templates": "Enable User Templates",
  SlidesRup_Settings_Heading: "SlidesRup Settings",
  "SlidesRup Running Language": "SlidesRup Running Language",
  "Please select your slidesRup framework running language": "Please select your slidesRup framework running language",
  "Auto (Follow System Language)": "Auto (Follow System Language)",
  Chinese: "Chinese",
  "Chinses Traditional": "Chinses Traditional",
  English: "English",
  "Reload OB": "Reload OB",
  "Presentation Plugin": "Presentation Plugin",
  "Please select your presentation plugin": "Please select your presentation plugin",
  "Slides Extended": "Slides Extended",
  "Advanced Slides": "Advanced Slides",
  "Font Setting": "Font Setting",
  "Heading Font": "Heading Font",
  "Set Heading Font": "Set Heading Font",
  "Main Font": "Main Font",
  "Set Main Font": "Set Main Font",
  "Your Heading Font": "Your Heading Font",
  xwwk: "\u971E\u9E5C\u6587\u6977",
  qtbfsxt: "\u5343\u56FE\u7B14\u950B\u624B\u5199\u4F53",
  qssxt: "\u6E05\u677E\u624B\u5199\u4F53",
  opsa: "OPPO Sans",
  systcn: "\u601D\u6E90\u5B8B\u4F53",
  xwxzs: "\u971E\u9E5C\u65B0\u81F4\u5B8B",
  pxzs: "\u5C4F\u663E\u81FB\u5B8B",
  prsxt: "\u54C1\u5982\u624B\u5199\u4F53",
  nswt: "\u5973\u4E66\u68A7\u6850",
  pmzdzgkt: "\u5E9E\u95E8\u6B63\u9053\u771F\u8D35\u6977\u4F53",
  pmzdcsd: "\u5E9E\u95E8\u6B63\u9053\u7C97\u4E66\u4F53",
  jxzk: "\u6C5F\u897F\u62D9\u6977",
  dyzgt: "\u6597\u9C7C\u8FFD\u5149\u4F53",
  hzpyt: "\u6C49\u5B57\u62FC\u97F3\u4F53",
  mspyt: "\u840C\u795E\u62FC\u97F3\u4F53",
  xwmh: "\u971E\u9E5C\u6F2B\u9ED1",
  "H1 Font": "H1 Font",
  "H2 Font": "H2 Font",
  "H3 Font": "H3 Font",
  "H4 Font": "H4 Font",
  "H5 Font": "H5 Font",
  "H6 Font": "H6 Font",
  "Tagline Font": "Tagline Font",
  "Slogan Font": "Slogan Font",
  "Nav Font": "Nav Font",
  "Set H1 Font": "Set H1 Font",
  "Set H2 Font": "Set H2 Font",
  "Set H3 Font": "Set H3 Font",
  "Set H4 Font": "Set H4 Font",
  "Set H5 Font": "Set H5 Font",
  "Set H6 Font": "Set H6 Font",
  "Set Tagline Font": "Set Tagline Font",
  "Set Slogan Font": "Set Slogan Font",
  "Set Nav Font": "Set Nav Font",
  "H1 Size": "H1 Size",
  "H2 Size": "H2 Size",
  "H3 Size": "H3 Size",
  "H4 Size": "H4 Size",
  "H5 Size": "H5 Size",
  "H6 Size": "H6 Size",
  "Tagline Size": "Tagline Size",
  "Slogan Size": "Slogan Size",
  "Nav Size": "Nav Size",
  "Set H1 Size": "Set H1 Size",
  "Set H2 Size": "Set H2 Size",
  "Set H3 Size": "Set H3 Size",
  "Set H4 Size": "Set H4 Size",
  "Set H5 Size": "Set H5 Size",
  "Set H6 Size": "Set H6 Size",
  "Set Tagline Size": "Set Tagline Size",
  "Set Slogan Size": "Set Slogan Size",
  "Set Nav Size": "Set Nav Size",
  "Adjust the font size of H1": "Adjust the font size of H1",
  "Adjust the font size of H2": "Adjust the font size of H2",
  "Adjust the font size of H3": "Adjust the font size of H3",
  "Adjust the font size of H4": "Adjust the font size of H4",
  "Adjust the font size of H5": "Adjust the font size of H5",
  "Adjust the font size of H6": "Adjust the font size of H6",
  "Adjust the font size of Tagline": "Adjust the font size of Tagline",
  "Adjust the font size of Slogan": "Adjust the font size of Slogan",
  "Adjust the font size of Nav": "Adjust the font size of Nav",
  "Font Family": "Font Family",
  "Font Size": "Font Size",
  "Body Size": "Body Size",
  "Adjust the font size of body": "Adjudt the font size of body",
  "Text Transform": "Text Transform",
  "Heading Text Transform": "Heading Text Transform",
  "Set text transform for all headings": "Set text transform for all headings",
  "Heading Colors": "Heading Colors",
  "H1 Color": "H1 Color",
  "H2 Color": "H2 Color",
  "H3 Color": "H3 Color",
  "H4 Color": "H4 Color",
  "H5 Color": "H5 Color",
  "H6 Color": "H6 Color",
  "Set the color for H1 headings": "Set the color for H1 headings",
  "Set the color for H2 headings": "Set the color for H2 headings",
  "Set the color for H3 headings": "Set the color for H3 headings",
  "Set the color for H4 headings": "Set the color for H4 headings",
  "Set the color for H5 headings": "Set the color for H5 headings",
  "Set the color for H6 headings": "Set the color for H6 headings",
  "Header Colors": "Header Colors",
  "Tagline Color": "Tagline Color",
  "Set the color for tagline text": "Set the color for tagline text",
  "Slogan Color": "Slogan Color",
  "Set the color for slogan text": "Set the color for slogan text",
  "Nav Color": "Nav Color",
  "Set the color for navigation text": "Set the color for navigation text",
  "Body Colors": "Body Colors",
  "Body Color": "Body Color",
  "Paragraph Color": "Paragraph Color",
  "List Color": "List Color",
  "Strong Color": "Strong Color",
  "Emphasis Color": "Emphasis Color",
  "Link Color": "Link Color",
  "Set the color for body text": "Set the color for body text",
  "Set the color for paragraphs": "Set the color for paragraphs",
  "Set the color for lists": "Set the color for lists",
  "Set the color for strong/bold text": "Set the color for strong/bold text",
  "Set the color for emphasis/italic text": "Set the color for emphasis/italic text",
  "Set the color for links": "Set the color for links",
  "Theme Colors": "Theme Colors",
  Capitalize: "Capitalize",
  Uppercase: "Uppercase",
  Lowercase: "Lowercase",
  "Use User Color Setting": "Use User Color Setting",
  "Use User Font Family Setting": "Use User Font Family Setting",
  "Use User Font Size Setting": "Use User Font Size Setting",
  "Use Default Value": "Use Default Value",
  "Customize Text Colors": "Customize Text Colors",
  "Advanced Settings": "Advanced Settings",
  "Use User Customized CSS": "Use User Customized CSS",
  "Enable User Customized CSS": "Enable User Customized CSS",
  "Enable User Font Family Setting": "Enable User Font Family Setting",
  "Enable User Font Size Setting": "Enable User Font Size Setting",
  "Enable User Color Setting": "Enable User Color Setting",
  "Invalid Format: No headings found": "Invalid Format: No headings found",
  "Invalid Format: Document must contain H1 headings": "Invalid Format: Document must contain H1 heading",
  "Invalid Format: Document must contain only one H1 heading": "Invalid Format: Document must contain only one level 1 heading",
  "Convert to Slide": "Convert Current File to Slide",
  "This file is already a slide presentation": "This file is already a slide presentation",
  "Theme Color": "Theme Color",
  "Set the theme color": "Set the theme color for the slide presentation",
  "Slide Mode": "Slide Color Mode",
  "Set the slide mode": "Set the color mode for the slide presentation",
  "Light Mode": "Light Mode",
  "Dark Mode": "Dark Mode",
  "User Designs": "User Designs",
  "Please select your user design": "Please select your design",
  "Customized CSS": "Customized CSS",
  "User Designs CSS": "User Designs CSS",
  "Enable CSS:": "Enable CSS:",
  "User Templates": "User Templates",
  "Design and Templates": "Design and Templates",
  "Auto Convert Links": "Auto Convert Links",
  ACLD: "Convert Links To Support Lightbox",
  "Enable Paragraph Fragments": "Enable Paragraph Fragments",
  EPF: "Use Fragments Effect for Paragraph",
  BlankPage: "Blank",
  ContentPage: "Content",
  "Create New Design From Blank": "Create New Design From Blank",
  "Create New Design From Current Design": "Create New Design From Current Design",
  "Please input your design name": "Please input your design name",
  "Cann't find the source folder": "Cann't find the source folder: ",
  "Cann't copy the source file": "Cann't copy the source file: ",
  "Error Info": "Error Info: ",
  "Cann't create file": "Cann't create file: ",
  "Slide Default List": "Slide Default List",
  "Fancy List": "Fancy List",
  "Fancy List Row": "Fancy List Row",
  "Fancy List With Order": "Fancy List With Order",
  "Fancy List With Order Row": "Fancy List With Order Row",
  "Grid List": "Grid List",
  "Grid Step List": "Grid Step List",
  "Grid Step List Vertical": "Grid Step List Vertical",
  "Box List": "Box List",
  "Order List With Border": "Order List With Border",
  "Default TOC Page List Class": "Default TOC Page List Class",
  "Please select the default list class for TOC pages": "Please select the default list class for TOC pages",
  "Default Chapter Page List Class": "Default Chapter Page List Class",
  "Please select the default list class for chapter pages": "Please select the default list class for chapter pages",
  "Default Content Page List Class": "Default Content Page List Class",
  "Please select the default list class for content pages": "Please select the default list class for content pages",
  "Default Blank Page List Class": "Default Blank Page List Class",
  "Please select the default list class for blank pages": "Please select the default list class for blank pages",
  "Default BackCover Page List Class": "Default BackCover Page List Class",
  "Please select the default list class for backcover page": "Please select the default list class for backcover page",
  "Default Slide Size": "Default Slide Size",
  "Please select your default slide size": "Please select your default slide size",
  "Presentation 16:9": "Presentation 16:9",
  "Presentation 9:16": "Presentation 9:16",
  "A4 Vertical": "A4 Vertical",
  "A4 Horizontal": "A4 Horizontal",
  "User TOC Page List Class": "User TOC Page List Class",
  "User Chapter Page List Class": "User Chapter Page List Class",
  "User Content Page List Class": "User Content Page List Class",
  "User Blank Page List Class": "User Blank Page List Class",
  "User BackCover Page List Class": "User BackCover Page List Class",
  "Set User TOC Page List Class": "Set User TOC Page List Class",
  "Set User Chapter Page List Class": "Set User Chapter Page List Class",
  "Set User Content Page List Class": "Set User Content Page List Class",
  "Set User Blank Page List Class": "Set User Blank Page List Class",
  "Set User BackCover Page List Class": "Set User BackCover Page List Class",
  "This Action is only available for Paid Users": "This Action is only available for Paid Users",
  "Content Page Slide Type": "Content Page Slide Type",
  "Please select the default slide type for content pages": "Please select the default slide type for content pages",
  Horizontal: "Horizontal",
  Vertical: "Vertical",
  "Slide Navigation Mode": "Slide Navigation Mode",
  "Please select the default slide navigation mode": "Please select the default slide navigation mode",
  Default: "Default",
  Linear: "Linear",
  Grid: "Grid",
  "Default TOC Page Position": "Default TOC Page Position",
  "Set Default TOC Page Position": "Set Default TOC Page Position",
  "Convert to Marp Slides": "Convert Active File to Marp Slides",
  "User Specific Frontmatter Options": "User Specific Frontmatter Options",
  "User Customized CSS": "User Customized CSS",
  "Input Your Customized CSS": "Input Your Customized CSS",
  "Frontmatter Options": "Frontmatter Options",
  "Input Your Frontmatter Options": "Input Your Frontmatter Options",
  "Advanced Slides YAML Reference": "Advanced Slides YAML Reference",
  "Get The Latest Version Of Marp Themes": "Get The Latest Version Of Marp Themes",
  "Marp Themes updated.": "Marp Themes Updated.",
  "Add Default Marp Themes for VS Code": "Add Default Marp Themes for VS Code",
  "User Customized Marp CSS": "User Customized Marp CSS",
  "Input Your Customized Marp CSS": "Input Your Customized Marp CSS",
  "Toggle TOC Page Fragments": "Toggle TOC Page Fragments",
  "Toggle Chapter Page Fragments": "Toggle Chapter Page Fragments",
  "Turn on to use fragments": "Turn on to use fragments",
  "List Class Name Added by User": "List Class Name Added by User",
  "Columns Class Name Added by User": "Columns Class Name Added by User",
  "One Class name each line": "One Class name per line",
  WithoutNav: "WithoutNav",
  "Turn on Base Layout Nav": "Turn on Base Layout Nav",
  "Turn on to use base layout with nav": "Turn on to use base layout with nav",
  SLIDESRUP_SLOGAN: "Simple, Elegant, and Powerful",
  "Separate Nav and TOC": "Separate Nav and TOC",
  "Turn on to separate nav and TOC": "Turn on to separate nav and TOC",
  Nav: "Nav",
  "Toggle Chapter and Content Page Heading OBURI": "Toggle Chapter and Content Page Heading OBURI",
  "Turn on to enable Heading OBURI for chapter and content pages": "Turn on to enable Heading OBURI for chapter and content pages",
  "commentController.appendClass": "Append Class",
  "commentController.replaceClass": "Replace Class",
  "commentController.anchorHeading": "Anchor Heading",
  "commentController.addNotes": "Add Notes",
  "commentController.replaceTemplate": "Replace Template",
  "commentController.addHeadingAliases": "Add Heading Aliases",
  "commentController.addPageSeparator": "Add Page Separator",
  "commentController.resetCounter": "Reset Counter",
  "commentController.useNoNavTemplate": "Use Template Without Nav",
  "commentController.hideSlide": "Hide Slide",
  "commentController.addSlideBackground": "Add Slide Background",
  "blockController.block": "Normal Block",
  "blockController.leftBlock": "Left Aligned Block",
  "blockController.centerBlock": "Center Aligned Block",
  "blockController.rightBlock": "Right Aligned Block",
  "Get The Latest Version Of Help Docs": "Get The Latest Version Of Help Docs",
  "Help docs updated.": "Help docs updated.",
  WithoutComments: "withoutComments",
  NoteCreated: "Note Created: ",
  NoteUpdated: "Note Updated: ",
  FailedToCreateOrUpdateNote: "Failed to create or update note: ",
  MakeCopyWithoutComments: "Create or update a copy without comments",
  "Help documents updated today": "Help documents updated today",
  "Help documents updated in the past week": "Help documents updated in the past week",
  "Help documents updated in the past two weeks": "Help documents updated in the past two weeks",
  "Help documents updated in the past month": "Help documents updated in the past month",
  "All help documents": "All help documents",
  "Update User Permissions": "Update User Permissions",
  "Update User Permissions Success": "Update User Permissions Success",
  "Update User Permissions Failed": "Update User Permissions Failed",
  "Updating User Permissions ...": "Updating User Permissions ...",
  "Slides Saving Location": "Slides Saving Location",
  "Slides Basic Settings": "Slides Basic Settings",
  "Invalid GitHub repository URL": "Invalid GitHub repository URL",
  "Invalid Gitee repository URL": "Invalid Gitee repository URL",
  "Checking for updates from": "Checking for updates from",
  "No release found for this repository": "No release found for this repository",
  "Release is missing manifest.json or main.js. Cannot install.": "Release is missing manifest.json or main.js. Cannot install.",
  "Invalid manifest.json: missing 'id' field": "Invalid manifest.json: missing 'id' field",
  Plugin: "Plugin",
  "installed/updated successfully": "installed/updated successfully",
  reloaded: "reloaded",
  "Automatic reload failed": "Automatic reload failed",
  "Plugin updated but reload failed": "Plugin updated but reload failed. Please restart Obsidian or re-enable the plugin manually.",
  "Plugin installed, please enable manually": "Plugin installed, please enable it in settings manually.",
  "Failed to install plugin": "Failed to install plugin",
  "Check console for details": "Check console for details",
  "is already up to date": "is already up to date",
  "Current Version": "Current Version",
  "Check for Updates": "Check for Updates",
  "Checking...": "Checking...",
  "Already up to date": "Already up to date",
  "Update available": "Update available",
  "Start Update": "Start Update",
  "You are using a development version": "You are using a development version",
  "Failed to check for updates": "Failed to check for updates",
  "Updating...": "Updating...",
  Updated: "Updated",
  "Restart Obsidian to apply changes": "Restart Obsidian to apply changes",
  "Install IOTO Dashboard": "Install IOTO Dashboard",
  "Downloading manifest": "Downloading manifest...",
  "Downloading plugin files": "Downloading plugin files...",
  PluginIndicator: " (Plugin)",
  API_Token_Invalid: "API Token Invalid",
  "Plugin Download Source": "Plugin Download Source",
  "Choose where to download and update plugins": "Choose where to download and update plugins",
  GitHub: "GitHub",
  Gitee: "Gitee",
  "Open Design Maker": "Open Design Maker",
  "Design Maker": "Design Maker",
  "Enable Design Maker": "Enable Design Maker",
  "Enable the visual Design Maker workspace": "Enable the visual Design Maker workspace",
  "Default Design Maker Base Design": "Default Design Maker Base Design",
  "Please select the default design used by Design Maker": "Please select the default design used by Design Maker",
  "Show Design Maker Advanced Source Editor": "Show Design Maker Advanced Source Editor",
  "Show the fallback source editor in Design Maker": "Show the fallback source editor in Design Maker",
  "Auto sync VS Code theme after saving": "Auto sync VS Code theme after saving",
  "Sync the Marp theme to VS Code after Design Maker saves": "Sync the Marp theme to VS Code after Design Maker saves",
  "Design Maker Preview Scale": "Design Maker Preview Scale",
  "Adjust the preview scale in Design Maker": "Adjust the preview scale in Design Maker",
  "Design Maker Slide Base Width": "Design Maker Slide Base Width",
  "Set the logical slide width used by Design Maker rendering": "Set the logical slide width used by Design Maker rendering",
  "Design Maker Slide Base Height": "Design Maker Slide Base Height",
  "Set the logical slide height used by Design Maker rendering": "Set the logical slide height used by Design Maker rendering",
  "Design Maker saved": "Design Maker saved",
  "Design already exists": "Design already exists",
  "Save and Apply": "Save and Apply",
  "Reload Design": "Reload Design",
  "Design Pages": "Design Pages",
  "Load Design": "Load Design",
  "Contains source only blocks": "Contains source only blocks",
  "Show Block": "Show Block",
  "Hide Block": "Hide Block",
  "Design Theme": "Design Theme",
  "Primary Color": "Primary Color",
  "Secondary Color": "Secondary Color",
  "Background Color": "Background Color",
  "Text Color": "Text Color",
  "Body Font": "Body Font",
  "Heading Scale": "Heading Scale",
  "Body Scale": "Body Scale",
  "Border Radius": "Border Radius",
  "Shadow Opacity": "Shadow Opacity",
  "Theme Mode": "Theme Mode",
  "Live Preview": "Live Preview",
  "Block Inspector": "Block Inspector",
  "Select a block": "Select a block",
  "This block is source only": "This block is source only",
  "Block Content": "Block Content",
  "CSS Class": "CSS Class",
  "Inline Style": "Inline Style",
  "Page Source": "Page Source",
  "Apply Source Changes": "Apply Source Changes",
  "Theme CSS": "Theme CSS",
  "Apply Theme CSS": "Apply Theme CSS",
  "Theme CSS updated": "Theme CSS updated",
  "No design loaded": "No design loaded",
  "Loading design": "Loading design...",
  "Failed to load design": "Failed to load design: ",
  "Add Grid": "Add Grid",
  "Add Text": "Add Text",
  "Add Image": "Add Image",
  "Add Placeholder": "Add Placeholder",
  "Add Content Slot": "Add Content Slot",
  "Duplicate Block": "Duplicate Block",
  "Delete Block": "Delete Block",
  "Add Footnotes": "Add Footnotes",
  "Add SR-SideBar": "Add SR-SideBar",
  "Empty Block": "Empty Block",
  "Create New Design In Design Maker": "Create New Design In Design Maker",
  "Load Existing Design In Design Maker": "Load Existing Design In Design Maker",
  "No existing user designs found": "No existing user designs found",
  "Footnotes block already exists": "Footnotes block already exists",
  "SR-SideBar block already exists": "SR-SideBar block already exists",
  Design: "Design",
  Preview: "Preview",
  "Placeholder Category Layout": "Layout",
  "Placeholder Category Navigation": "Navigation",
  "Placeholder Category Metadata": "Metadata",
  "Placeholder Category Branding": "Branding",
  "Placeholder Category Variable": "Variable",
  X: "X",
  Y: "Y",
  Width: "Width",
  Height: "Height",
  Padding: "Padding",
  Flow: "Flow",
  "Justify Content": "Justify Content",
  Background: "Background",
  Border: "Border",
  Animation: "Animation",
  Opacity: "Opacity",
  Rotate: "Rotate",
  Fragment: "Fragment",
  Column: "Column",
  Row: "Row",
  Left: "Left",
  Right: "Right",
  Center: "Center",
  Justify: "Justify",
  Block: "Block",
  Top: "Top",
  Bottom: "Bottom",
  "Top Left": "Top Left",
  "Top Right": "Top Right",
  "Bottom Left": "Bottom Left",
  "Bottom Right": "Bottom Right",
  Stretch: "Stretch",
  Start: "Start",
  End: "End",
  "Space Between": "Space Between",
  "Space Around": "Space Around",
  "Space Evenly": "Space Evenly",
  "Fade In": "Fade In",
  "Fade Out": "Fade Out",
  "Slide Right In": "Slide Right In",
  "Slide Left In": "Slide Left In",
  "Slide Up In": "Slide Up In",
  "Slide Down In": "Slide Down In",
  "Slide Right Out": "Slide Right Out",
  "Slide Left Out": "Slide Left Out",
  "Slide Up Out": "Slide Up Out",
  "Slide Down Out": "Slide Down Out",
  "Scale Up": "Scale Up",
  "Scale Up Out": "Scale Up Out",
  "Scale Down": "Scale Down",
  "Scale Down Out": "Scale Down Out",
  Slower: "Slower",
  Faster: "Faster",
  Filter: "Filter",
  Align: "Align"
};

// src/lang/locale/zh-cn.ts
var zh_cn_default = {
  LicensePurchaseInfo: "\u60A8\u9700\u8981\u8D2D\u4E70\u8BB8\u53EF\u8BC1\u624D\u80FD\u4F7F\u7528 SlidesRup \u7684\u6240\u6709\u529F\u80FD\u3002\u8BF7\u8054\u7CFB\u4F5C\u8005\u83B7\u53D6\u66F4\u591A\u4FE1\u606F\u3002",
  AuthorWechatID: "\u4F5C\u8005\u5FAE\u4FE1ID: johnnylearns",
  "You must provide an API Key to run this command": "\u8FD0\u884C\u6B64\u547D\u4EE4\u5FC5\u987B\u63D0\u4F9B API \u5BC6\u94A5",
  "Get The Latest Version Of Sync Scripts": "\u83B7\u53D6\u6700\u65B0\u7684\u540C\u6B65\u811A\u672C",
  "Get The Latest Version Of Demo Sync Templates": "\u83B7\u53D6\u6700\u65B0\u7684\u6F14\u793A\u7248\u540C\u6B65\u6A21\u677F",
  "Get Your Personal Sync Templates": "\u83B7\u53D6\u60A8\u7684\u4E2A\u4EBA\u540C\u6B65\u6A21\u677F",
  "Main Setting": "\u4E3B\u8981\u8BBE\u7F6E",
  "Sync Scripts Update API Key": "\u540C\u6B65\u811A\u672C\u66F4\u65B0 API \u5BC6\u94A5",
  "Please enter a valid update API Key": "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u66F4\u65B0 API \u5BC6\u94A5",
  "Enter the API Key": "\u8F93\u5165API\u5BC6\u94A5",
  "Sync Scripts Folder": "\u540C\u6B65\u811A\u672C\u6587\u4EF6\u5939",
  "Please enter the path to the Templater Scripts Folder": "\u8BF7\u8F93\u5165Templater\u811A\u672C\u6587\u4EF6\u5939\u7684\u8DEF\u5F84",
  "Enter the full path to the Templater Scripts folder": "\u8F93\u5165Templater\u811A\u672C\u6587\u4EF6\u5939\u7684\u5B8C\u6574\u8DEF\u5F84",
  "Demo Sync templates Folder": "\u6F14\u793A\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u5939",
  "Please enter the path to the demo sync templates folder": "\u8BF7\u8F93\u5165\u6F14\u793A\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u5939\u7684\u8DEF\u5F84",
  "Enter the path to the demo sync templates folder": "\u8F93\u5165\u6F14\u793A\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u5939\u7684\u8DEF\u5F84",
  "User Templates Setting": "\u7528\u6237\u6A21\u677F\u8BBE\u7F6E",
  "Your Airtable Personal Token": "\u4F60\u7684 Airtable \u4E2A\u4EBA\u4EE4\u724C",
  "Please enter your personal Aritable token for your sync setting base": "\u8BF7\u8F93\u5165\u60A8\u7528\u4E8E\u540C\u6B65\u8BBE\u7F6E\u7684\u4E2A\u4EBA Aritable \u4EE4\u724C",
  "Enter your personal Airtble token": "\u8F93\u5165\u60A8\u7684\u4E2A\u4EBAAirtable\u4EE4\u724C",
  "Your Sync Setting Base ID": "\u4F60\u7684\u540C\u6B65\u8BBE\u7F6E\u5E93ID",
  "Please enter the base id of your sync setting base": "\u8BF7\u8F93\u5165\u60A8\u7684\u540C\u6B65\u8BBE\u7F6E\u5E93\u7684\u5E93ID",
  "Enter the base id": "\u8F93\u5165\u5E93ID",
  "Your Sync Setting Table ID": "\u4F60\u7684\u540C\u6B65\u8BBE\u7F6E\u8868ID",
  "Please enter the table id of your sync setting table": "\u8BF7\u8F93\u5165\u540C\u6B65\u8BBE\u7F6E\u8868\u7684\u8868ID",
  "Enter the table id": "\u8F93\u5165\u8868\u683CID",
  "Your Sync Setting view ID": "\u4F60\u7684\u540C\u6B65\u8BBE\u7F6E\u89C6\u56FEID",
  "Please enter the view id of your sync setting table": "\u8BF7\u8F93\u5165\u540C\u6B65\u8BBE\u7F6E\u8868\u7684\u89C6\u56FEID",
  "Enter the view id": "\u8F93\u5165\u89C6\u56FEID",
  "Your Sync Templates Folder": "\u4F60\u7684\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u5939",
  "Please enter the path to your sync templates folder": "\u8BF7\u8F93\u5165\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u5939\u7684\u8DEF\u5F84",
  "Enter the path to your sync templates folder": "\u8F93\u5165\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u5939\u7684\u8DEF\u5F84",
  "Updating, plese wait for a moment": "\u6B63\u5728\u66F4\u65B0\uFF0C\u8BF7\u7A0D\u5019",
  "Your API Key was expired. Please get a new one.": "\u4F60\u7684API\u5BC6\u94A5\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u83B7\u53D6\u65B0\u7684\u5BC6\u94A5",
  Got: "\u5DF2\u83B7\u53D6",
  records: "\u8BB0\u5F55",
  "Getting Data \u2026\u2026": "\u6B63\u5728\u83B7\u53D6\u6570\u636E\u2026\u2026",
  "files needed to be updated or created.": "\u9700\u8981\u66F4\u65B0\u6216\u521B\u5EFA\u7684\u6587\u4EF6",
  "Failed to write file: ": "\u5199\u5165\u6587\u4EF6\u5931\u8D25\uFF1A",
  "There are": "\u8FD8\u6709",
  "files needed to be processed.": "\u9700\u8981\u5904\u7406\u7684\u6587\u4EF6",
  "All Finished.": "\u5168\u90E8\u5B8C\u6210",
  "Your Sync Setting URL": "\u4F60\u7684\u540C\u6B65\u8BBE\u7F6E\u8868\u7684Airtable\u94FE\u63A5",
  "Please enter the url of your sync setting table": "\u8BF7\u8F93\u5165\u4F60\u7684\u540C\u6B65\u8BBE\u7F6E\u8868\u7684Airtable\u94FE\u63A5",
  "Enter the url": "\u8BF7\u8F93\u5165\u94FE\u63A5",
  "Your Email Address": "\u4F60\u7684\u7535\u5B50\u90AE\u4EF6\u5730\u5740",
  "Please enter the email you provided when you purchase this product": "\u8BF7\u8F93\u5165\u60A8\u8D2D\u4E70\u6B64\u4EA7\u54C1\u65F6\u63D0\u4F9B\u7684\u7535\u5B50\u90AE\u4EF6\u5730\u5740",
  "Enter your email": "\u8F93\u5165\u4F60\u7684\u7535\u5B50\u90AE\u4EF6",
  "When you use the sync with online database feature of IOTO, the sync configration generater I built could help you a lot.": "\u5F53\u4F60\u4F7F\u7528IOTO\u7684\u5728\u7EBF\u6570\u636E\u5E93\u540C\u6B65\u529F\u80FD\u65F6\uFF0C\u6211\u6784\u5EFA\u7684\u540C\u6B65\u914D\u7F6E\u751F\u6210\u5668\u53EF\u4EE5\u5E2E\u52A9\u4F60\u5F88\u591A",
  "You can use the following link to open the shared base and save it to your own Airtable workspace.": "\u4F60\u53EF\u4EE5\u4F7F\u7528\u4EE5\u4E0B\u94FE\u63A5\u6253\u5F00\u5171\u4EAB\u5E93\u5E76\u5C06\u5176\u4FDD\u5B58\u5230\u4F60\u81EA\u5DF1\u7684Airtable\u5DE5\u4F5C\u533A",
  "Sync Configration Generator": "\u540C\u6B65\u914D\u7F6E\u751F\u6210\u5668",
  "You can watch the follow video to find out how to use this sync configration base.": "\u4F60\u53EF\u4EE5\u89C2\u770B\u4EE5\u4E0B\u89C6\u9891\u4E86\u89E3\u5982\u4F55\u4F7F\u7528\u8FD9\u4E2A\u540C\u6B65\u914D\u7F6E\u5E93",
  "How to use the sync configration generator": "\u540C\u6B65\u914D\u7F6E\u751F\u6210\u5668\u7528\u6CD5\u6F14\u793A",
  "In order to help you to learn how to use the sync with online database feature, I will keep posting instructions and videos to the following link.": "\u4E3A\u4E86\u5E2E\u52A9\u4F60\u5B66\u4E60\u5982\u4F55\u4F7F\u7528\u4E0E\u5728\u7EBF\u6570\u636E\u5E93\u540C\u6B65\u7684\u529F\u80FD\uFF0C\u6211\u5C06\u4E0D\u65AD\u53D1\u5E03\u76F8\u5173\u6559\u7A0B\u548C\u89C6\u9891\u5230\u4EE5\u4E0B\u94FE\u63A5\u3002",
  "OB Sync With MDB How To Guide": "OB Sync With MDB \u4F7F\u7528\u6559\u7A0B",
  "Validating...": "\u6B63\u5728\u9A8C\u8BC1...",
  "Valid API Key": "\u6709\u6548API\u5BC6\u94A5",
  "Valid Email": "\u6709\u6548\u7535\u5B50\u90AE\u4EF6",
  Valid: "\u9A8C\u8BC1\u901A\u8FC7",
  "SlidesRup Update API Key": "SlidesRup \u66F4\u65B0 API \u5BC6\u94A5",
  "SlidesRup Framework Folder": "SlidesRup \u6846\u67B6\u6587\u4EF6\u5939",
  "SlidesRup Framework Folder Description": "SlidesRup \u6846\u67B6\u6587\u4EF6\u5939\u8BF4\u660E",
  "Get The Latest Version Of Style": "\u83B7\u53D6\u6700\u65B0\u7248\u672C\u7684\u6837\u5F0F",
  "Get The Latest Version Of Templates": "\u83B7\u53D6\u6700\u65B0\u7248\u672C\u7684\u8BBE\u8BA1\u6A21\u677F",
  "Get The Latest Version Of User Templates": "\u83B7\u53D6\u6700\u65B0\u7684\u7528\u6237\u6F14\u793A\u6A21\u677F",
  "One Click to Deploy": "\u4E00\u952E\u90E8\u7F72",
  "Please enter the path to the SlidesRup Framework Folder": "\u8BF7\u8F93\u5165 SlidesRup \u6846\u67B6\u6587\u4EF6\u5939\u7684\u8DEF\u5F84",
  "Enter the full path to the SlidesRup Framework folder": "\u8F93\u5165 SlidesRup \u6846\u67B6\u6587\u4EF6\u5939\u7684\u5B8C\u6574\u8DEF\u5F84",
  "Create New Slides": "\u521B\u5EFA\u65B0\u7684\u6F14\u793A",
  "Slide Design A": "\u6F14\u793A\u8BBE\u8BA1A",
  "Slide Design B": "\u6F14\u793A\u8BBE\u8BA1B",
  "Slide Design C": "\u6F14\u793A\u8BBE\u8BA1C",
  "Slide Design D": "\u6F14\u793A\u8BBE\u8BA1D",
  "Slide Design E": "\u6F14\u793A\u8BBE\u8BA1E",
  "Slide Design F": "\u6F14\u793A\u8BBE\u8BA1F",
  "Slide Design G": "\u6F14\u793A\u8BBE\u8BA1G",
  "Slide Design H": "\u6F14\u793A\u8BBE\u8BA1H",
  "Slide Design": "\u6F14\u793A\u8BBE\u8BA1",
  "Please select a slide design": "\u8BF7\u9009\u62E9\u6F14\u793A\u8BBE\u8BA1",
  "New Slide": "\u65B0\u6F14\u793A",
  "Untitled Slide": "\u672A\u547D\u540D\u6F14\u793A",
  "Current Folder": "\u5F53\u524D\u6587\u4EF6\u5939",
  "User Assigned Folder": "\u7528\u6237\u6307\u5B9A\u6587\u4EF6\u5939",
  "Select Location": "\u9009\u62E9\u4F4D\u7F6E",
  "Default New Slide Location": "\u9ED8\u8BA4\u65B0\u6F14\u793A\u4F4D\u7F6E",
  "Please enter the path to the default new slide location": "\u8BF7\u8F93\u5165\u9ED8\u8BA4\u65B0\u6F14\u793A\u4F4D\u7F6E\u7684\u8DEF\u5F84",
  "Enter the full path to the default new slide location": "\u8F93\u5165\u9ED8\u8BA4\u65B0\u6F14\u793A\u4F4D\u7F6E\u7684\u5B8C\u6574\u8DEF\u5F84",
  "New Slide Location Option": "\u65B0\u6F14\u793A\u4F4D\u7F6E\u9009\u9879",
  "Please select the default new slide location option": "\u8BF7\u9009\u62E9\u9ED8\u8BA4\u65B0\u6F14\u793A\u4F4D\u7F6E\u9009\u9879",
  "Decide At Creation": "\u521B\u5EFA\u65F6\u51B3\u5B9A",
  Cover: "\u5C01\u9762",
  Chapter: "\u7AE0\u8282",
  TOC: "\u76EE\u5F55",
  BackCover: "\u5C01\u5E95",
  BaseLayout: "\u57FA\u672C\u5E03\u5C40",
  SubSlide: "\u5B50\u9875\u9762",
  List: "\u5217\u8868",
  SubList: "\u5B50\u5217\u8868",
  "Use SlidesRup to Express Yourself": "\u7528SlidesRup\u8868\u8FBE\u81EA\u5DF1",
  Farewell: "\u518D\u4F1A",
  "Content is the king": "\u5185\u5BB9\u4E3A\u738B",
  "Keep is simple and powerful": "\u7B80\u5355\u5374\u5F3A\u5927",
  "Focus on the basic first": "\u5173\u6CE8\u57FA\u672C",
  "Operation cancelled by user": "\u7528\u6237\u53D6\u6D88\u64CD\u4F5C",
  "Starting one-click deployment...": "\u6B63\u5728\u4E00\u952E\u90E8\u7F72...",
  "Styles updated.": "\u6837\u5F0F\u5DF2\u66F4\u65B0\u3002",
  "Templates updated.": "\u6A21\u677F\u5DF2\u66F4\u65B0\u3002",
  "Demo slides updated.": "\u6F14\u793A\u793A\u4F8B\u5DF2\u66F4\u65B0\u3002",
  "One-click deployment finished!": "\u4E00\u952E\u90E8\u7F72\u5B8C\u6210\uFF01",
  "Default Design": "\u9ED8\u8BA4\u8BBE\u8BA1",
  "Please select your default design": "\u8BF7\u9009\u62E9\u4F60\u7684\u9ED8\u8BA4\u8BBE\u8BA1",
  None: "\u65E0",
  "Add Chapter": "\u6DFB\u52A0\u7AE0\u8282",
  "Add Page": "\u6DFB\u52A0\u5185\u5BB9\u9875",
  "User Templates Folder": "\u4F60\u7684\u6A21\u677F\u6587\u4EF6\u5939",
  "Please enter the path to your own templates": "\u8BF7\u9009\u62E9\u4F60\u7684\u6A21\u677F\u6587\u4EF6\u5939\u8DEF\u5F84",
  "Choose your templates folder": "\u9009\u62E9\u4F60\u7684\u6A21\u677F\u6587\u4EF6\u5939",
  "User Slide Template": "\u4F60\u7684\u6F14\u793A\u6A21\u677F",
  "Please choose your personal slide template": "\u8BF7\u9009\u62E9\u4F60\u7684\u6F14\u793A\u6A21\u677F\u6587\u4EF6",
  "Choose your personal slide template": "\u9009\u62E9\u4F60\u7684\u6F14\u793A\u6A21\u677F",
  "User Chapter Template": "\u4F60\u7684\u7AE0\u8282\u6A21\u677F",
  "Please choose your personal chapter template": "\u8BF7\u9009\u62E9\u4F60\u7684\u7AE0\u8282\u6A21\u677F\u6587\u4EF6",
  "Choose your personal chapter template": "\u9009\u62E9\u4F60\u7684\u7AE0\u8282\u6A21\u677F",
  "User Page Template": "\u4F60\u7684\u5185\u5BB9\u9875\u6A21\u677F",
  "Please choose your personal page template": "\u8BF7\u9009\u62E9\u4F60\u7684\u5185\u5BB9\u9875\u6A21\u677F\u6587\u4EF6",
  "Choose your personal page template": "\u9009\u62E9\u4F60\u7684\u5185\u5BB9\u9875\u6A21\u677F",
  "Color Setting": "\u989C\u8272\u8BBE\u7F6E",
  Hue: "\u8272\u76F8",
  Saturation: "\u9971\u548C\u5EA6",
  Lightness: "\u4EAE\u5EA6",
  "Preview Your Slide Theme Color": "\u9884\u89C8\u4F60\u7684\u6F14\u793A\u4E3B\u9898\u8272",
  "Adjust the hue of the theme": "\u8C03\u6574\u4E3B\u9898\u8272\u7684\u8272\u76F8",
  "Adjust the saturation of the theme": "\u8C03\u6574\u4E3B\u9898\u8272\u7684\u9971\u548C\u5EA6",
  "Adjust the lightness of the theme": "\u8C03\u6574\u4E3B\u9898\u8272\u7684\u4EAE\u5EA6",
  "Get The Latest Version SlidesRup Reveal Addons": "\u83B7\u53D6\u6700\u65B0\u7684SlidesRup Reveal\u6846\u67B6\u6269\u5C55\u6587\u4EF6",
  "Reveal template updated.": "Reveal\u6A21\u677F\u5DF2\u66F4\u65B0",
  "User TOC Template": "\u4F60\u7684\u6F14\u793A\u76EE\u5F55\u6A21\u677F",
  "Please choose your personal TOC template": "\u8BF7\u9009\u62E9\u4F60\u7684\u6F14\u793A\u76EE\u5F55\u6A21\u677F",
  "Choose your personal TOC template": "\u9009\u62E9\u4F60\u7684\u6F14\u793A\u76EE\u5F55\u6A21\u677F",
  Slide: "\u6F14\u793A",
  "User Base Layout Template": "\u4F60\u7684\u57FA\u672C\u5E03\u5C40\u6A21\u677F",
  "Please choose your personal base layout template": "\u8BF7\u9009\u62E9\u4F60\u7684\u57FA\u672C\u5E03\u5C40\u6A21\u677F",
  "Choose your personal base layout template": "\u9009\u62E9\u4F60\u7684\u57FA\u672C\u5E03\u5C40\u6A21\u677F",
  Confirm: "\u786E\u8BA4",
  Cancel: "\u53D6\u6D88",
  "Please input slide name": "\u8BF7\u8F93\u5165\u6F14\u793A\u540D\u5B57",
  "Please input slide folder name": "\u8BF7\u8F93\u5165\u6F14\u793A\u6587\u4EF6\u5939\u540D",
  "Customize Slide Folder Name": "\u81EA\u5B9A\u4E49\u6F14\u793A\u6587\u4EF6\u5939\u540D",
  "Use Customize Slide Folder Name": "\u4F7F\u7528\u81EA\u5B9A\u4E49\u7684\u6F14\u793A\u6587\u4EF6\u5939\u540D",
  "Slide Settings": "\u6F14\u793A\u8BBE\u7F6E",
  Tagline: "Logo \u6216 \u6807\u8BED",
  "Set Tagline": "\u8BBE\u7F6E Logo \u6216 \u6807\u8BED",
  "Your Tagline": "\u4F60\u7684 Logo \u6216 \u6807\u8BED",
  Slogan: "\u53E3\u53F7",
  "Set Slogan": "\u8BBE\u7F6E\u53E3\u53F7",
  "Your Slogan": "\u4F60\u7684\u53E3\u53F7",
  Presenter: "\u6F14\u8BB2\u8005",
  "Set Presenter": "\u8BBE\u7F6E\u6F14\u8BB2\u8005",
  "Date Format": "\u65E5\u671F\u683C\u5F0F",
  "Set Date Format": "\u8BBE\u7F6E\u65E5\u671F\u683C\u5F0F",
  "Your Date Format": "\u4F60\u7684\u65E5\u671F\u683C\u5F0F",
  "Please input chapter index number": "\u8BF7\u8F93\u5165\u7AE0\u8282\u7D22\u5F15\u53F7",
  "Please input chapter name": "\u8BF7\u8F93\u5165\u7AE0\u8282\u540D\u5B57",
  "Please input page index number": "\u8BF7\u8F93\u5165\u5185\u5BB9\u9875\u7D22\u5F15\u53F7",
  "Add Sub Pages When Add Chapter": "\u6DFB\u52A0\u7AE0\u8282\u65F6\u540C\u65F6\u6DFB\u52A0\u5B50\u9875\u9762",
  "User Chapter With Sub Pages Template": "\u4F60\u7684\u5305\u542B\u5B50\u9875\u9762\u7684\u7AE0\u8282\u6A21\u677F",
  "Please choose your personal chapter with sub pages template": "\u8BF7\u9009\u62E9\u4F60\u7684\u5305\u542B\u5B50\u9875\u9762\u7684\u7AE0\u8282\u6A21\u677F",
  "Choose your personal chapter with sub pages template": "\u9009\u62E9\u4F60\u7684\u5305\u542B\u5B50\u9875\u9762\u7684\u7AE0\u8282\u6A21\u677F",
  "Enable User Templates": "\u542F\u7528\u7528\u6237\u6A21\u677F",
  SlidesRup_Settings_Heading: "SlidesRup\u8BBE\u7F6E",
  "SlidesRup Running Language": "SlidesRup\u8FD0\u884C\u8BED\u8A00",
  "Please select your slidesRup framework running language": "\u8BF7\u9009\u62E9\u4F60\u7684SlidesRup\u6846\u67B6\u8FD0\u884C\u8BED\u8A00",
  "Auto (Follow System Language)": "\u81EA\u52A8\uFF08\u8DDF\u968F\u7CFB\u7EDF\u8BED\u8A00\uFF09",
  Chinese: "\u7B80\u4F53\u4E2D\u6587",
  "Chinses Traditional": "\u7E41\u4F53\u4E2D\u6587",
  "Reload OB": "\u91CD\u65B0\u52A0\u8F7D",
  "Presentation Plugin": "\u6F14\u793A\u63D2\u4EF6",
  "Please select your presentation plugin": "\u8BF7\u9009\u62E9\u4F60\u7684\u6F14\u793A\u63D2\u4EF6",
  "Font Setting": "\u5B57\u4F53\u5B57\u53F7\u8BBE\u7F6E",
  "Heading Font": "\u6807\u9898\u5B57\u4F53",
  "Set Heading Font": "\u8BBE\u7F6E\u6807\u9898\u5B57\u4F53",
  "Main Font": "\u6B63\u6587\u5B57\u4F53",
  "Set Main Font": "\u8BBE\u7F6E\u6B63\u6587\u5B57\u4F53",
  "Your Heading Font": "\u4F60\u7684\u6807\u9898\u5B57\u4F53",
  "H1 Font": "H1 \u5B57\u4F53",
  "H2 Font": "H2 \u5B57\u4F53",
  "H3 Font": "H3 \u5B57\u4F53",
  "H4 Font": "H4 \u5B57\u4F53",
  "H5 Font": "H5 \u5B57\u4F53",
  "H6 Font": "H6 \u5B57\u4F53",
  "Tagline Font": "\u6807\u8BED\u5B57\u4F53",
  "Slogan Font": "\u53E3\u53F7\u5B57\u4F53",
  "Nav Font": "\u5BFC\u822A\u5B57\u4F53",
  "Set H1 Font": "\u8BBE\u7F6E H1 \u5B57\u4F53",
  "Set H2 Font": "\u8BBE\u7F6E H2 \u5B57\u4F53",
  "Set H3 Font": "\u8BBE\u7F6E H3 \u5B57\u4F53",
  "Set H4 Font": "\u8BBE\u7F6E H4 \u5B57\u4F53",
  "Set H5 Font": "\u8BBE\u7F6E H5 \u5B57\u4F53",
  "Set H6 Font": "\u8BBE\u7F6E H6 \u5B57\u4F53",
  "Set Tagline Font": "\u8BBE\u7F6E\u6807\u8BED\u5B57\u4F53",
  "Set Slogan Font": "\u8BBE\u7F6E\u53E3\u53F7\u5B57\u4F53",
  "Set Nav Font": "\u8BBE\u7F6E\u5BFC\u822A\u5B57\u4F53",
  "H1 Size": "H1 \u5B57\u53F7",
  "H2 Size": "H2 \u5B57\u53F7",
  "H3 Size": "H3 \u5B57\u53F7",
  "H4 Size": "H4 \u5B57\u53F7",
  "H5 Size": "H5 \u5B57\u53F7",
  "H6 Size": "H6 \u5B57\u53F7",
  "Tagline Size": "\u6807\u8BED\u5B57\u53F7",
  "Slogan Size": "\u53E3\u53F7\u5B57\u53F7",
  "Nav Size": "\u5BFC\u822A\u5B57\u53F7",
  "Set H1 Size": "\u8BBE\u7F6E H1 \u5B57\u53F7",
  "Set H2 Size": "\u8BBE\u7F6E H2 \u5B57\u53F7",
  "Set H3 Size": "\u8BBE\u7F6E H3 \u5B57\u53F7",
  "Set H4 Size": "\u8BBE\u7F6E H4 \u5B57\u53F7",
  "Set H5 Size": "\u8BBE\u7F6E H5 \u5B57\u53F7",
  "Set H6 Size": "\u8BBE\u7F6E H6 \u5B57\u53F7",
  "Set Tagline Size": "\u8BBE\u7F6E\u6807\u8BED\u5B57\u53F7",
  "Set Slogan Size": "\u8BBE\u7F6E\u53E3\u53F7\u5B57\u53F7",
  "Set Nav Size": "\u8BBE\u7F6E\u5BFC\u822A\u5B57\u53F7",
  "Adjust the font size of H1": "\u8C03\u6574 H1 \u6807\u9898\u5B57\u53F7",
  "Adjust the font size of H2": "\u8C03\u6574 H2 \u6807\u9898\u5B57\u53F7",
  "Adjust the font size of H3": "\u8C03\u6574 H3 \u6807\u9898\u5B57\u53F7",
  "Adjust the font size of H4": "\u8C03\u6574 H4 \u6807\u9898\u5B57\u53F7",
  "Adjust the font size of H5": "\u8C03\u6574 H5 \u6807\u9898\u5B57\u53F7",
  "Adjust the font size of H6": "\u8C03\u6574 H6 \u6807\u9898\u5B57\u53F7",
  "Adjust the font size of Tagline": "\u8C03\u6574\u6807\u8BED\u5B57\u53F7",
  "Adjust the font size of Slogan": "\u8C03\u6574\u53E3\u53F7\u5B57\u53F7",
  "Adjust the font size of Nav": "\u8C03\u6574\u5BFC\u822A\u5B57\u53F7",
  "Font Family": "\u5B57\u4F53",
  "Font Size": "\u5B57\u53F7",
  "Body Size": "\u6B63\u6587\u5B57\u53F7",
  "Adjust the font size of body": "\u8C03\u6574\u6B63\u6587\u5B57\u53F7",
  "Text Transform": "\u6587\u5B57\u53D8\u6362",
  "Heading Text Transform": "\u6807\u9898\u6587\u5B57\u53D8\u6362",
  "Set text transform for all headings": "\u8BBE\u7F6E\u6240\u6709\u6807\u9898\u7684\u6587\u5B57\u53D8\u6362",
  "Heading Colors": "\u6807\u9898\u989C\u8272",
  "H1 Color": "H1 \u989C\u8272",
  "H2 Color": "H2 \u989C\u8272",
  "H3 Color": "H3 \u989C\u8272",
  "H4 Color": "H4 \u989C\u8272",
  "H5 Color": "H5 \u989C\u8272",
  "H6 Color": "H6 \u989C\u8272",
  "Set the color for H1 headings": "\u8BBE\u7F6E H1 \u6807\u9898\u7684\u989C\u8272",
  "Set the color for H2 headings": "\u8BBE\u7F6E H2 \u6807\u9898\u7684\u989C\u8272",
  "Set the color for H3 headings": "\u8BBE\u7F6E H3 \u6807\u9898\u7684\u989C\u8272",
  "Set the color for H4 headings": "\u8BBE\u7F6E H4 \u6807\u9898\u7684\u989C\u8272",
  "Set the color for H5 headings": "\u8BBE\u7F6E H5 \u6807\u9898\u7684\u989C\u8272",
  "Set the color for H6 headings": "\u8BBE\u7F6E H6 \u6807\u9898\u7684\u989C\u8272",
  "Header Colors": "\u5934\u90E8\u989C\u8272",
  "Tagline Color": "\u6807\u8BED\u989C\u8272",
  "Set the color for tagline text": "\u8BBE\u7F6E\u6807\u8BED\u6587\u5B57\u7684\u989C\u8272",
  "Slogan Color": "\u53E3\u53F7\u989C\u8272",
  "Set the color for slogan text": "\u8BBE\u7F6E\u53E3\u53F7\u6587\u5B57\u7684\u989C\u8272",
  "Nav Color": "\u5BFC\u822A\u989C\u8272",
  "Set the color for navigation text": "\u8BBE\u7F6E\u5BFC\u822A\u6587\u5B57\u7684\u989C\u8272",
  "Body Colors": "\u6B63\u6587\u989C\u8272",
  "Body Color": "\u6B63\u6587\u989C\u8272",
  "Paragraph Color": "\u6BB5\u843D\u989C\u8272",
  "List Color": "\u5217\u8868\u989C\u8272",
  "Strong Color": "\u5F3A\u8C03\u989C\u8272",
  "Emphasis Color": "\u659C\u4F53\u989C\u8272",
  "Link Color": "\u94FE\u63A5\u989C\u8272",
  "Set the color for body text": "\u8BBE\u7F6E\u6B63\u6587\u6587\u5B57\u7684\u989C\u8272",
  "Set the color for paragraphs": "\u8BBE\u7F6E\u6BB5\u843D\u7684\u989C\u8272",
  "Set the color for lists": "\u8BBE\u7F6E\u5217\u8868\u7684\u989C\u8272",
  "Set the color for strong/bold text": "\u8BBE\u7F6E\u7C97\u4F53\u6587\u5B57\u7684\u989C\u8272",
  "Set the color for emphasis/italic text": "\u8BBE\u7F6E\u659C\u4F53\u6587\u5B57\u7684\u989C\u8272",
  "Set the color for links": "\u8BBE\u7F6E\u94FE\u63A5\u7684\u989C\u8272",
  "Theme Colors": "\u4E3B\u9898\u989C\u8272",
  Capitalize: "\u9996\u5B57\u6BCD\u5927\u5199",
  Uppercase: "\u5168\u90E8\u5927\u5199",
  Lowercase: "\u5168\u90E8\u5C0F\u5199",
  "Use User Color Setting": "\u4F7F\u7528\u7528\u6237\u989C\u8272\u8BBE\u7F6E",
  "Use User Font Family Setting": "\u4F7F\u7528\u7528\u6237\u5B57\u4F53\u8BBE\u7F6E",
  "Use User Font Size Setting": "\u4F7F\u7528\u7528\u6237\u5B57\u53F7\u8BBE\u7F6E",
  "Use Default Value": "\u4F7F\u7528\u9ED8\u8BA4\u503C",
  "Customize Text Colors": "\u81EA\u5B9A\u4E49\u6587\u672C\u989C\u8272",
  "Advanced Settings": "\u9AD8\u7EA7\u8BBE\u7F6E",
  "Use User Customized CSS": "\u4F7F\u7528\u7528\u6237\u81EA\u5B9A\u4E49 CSS",
  "Enable User Customized CSS": "\u542F\u7528\u7528\u6237\u81EA\u5B9A\u4E49 CSS",
  "Enable User Font Family Setting": "\u542F\u7528\u7528\u6237\u5B57\u4F53\u8BBE\u7F6E",
  "Enable User Font Size Setting": "\u542F\u7528\u7528\u6237\u5B57\u53F7\u8BBE\u7F6E",
  "Enable User Color Setting": "\u542F\u7528\u7528\u6237\u989C\u8272\u8BBE\u7F6E",
  "Invalid Format: No headings found": "\u65E0\u6548\u683C\u5F0F\uFF1A\u672A\u627E\u5230\u6807\u9898",
  "Invalid Format: Document must contain H1 headings": "\u65E0\u6548\u683C\u5F0F\uFF1A\u6587\u6863\u5FC5\u987B\u5305\u542B\u4E00\u53F7\u6807\u9898",
  "No active editor, can't excute this command.": "\u6CA1\u6709\u6D3B\u52A8\u7F16\u8F91\u5668\uFF0C\u65E0\u6CD5\u6267\u884C\u6B64\u547D\u4EE4\u3002",
  "Invalid Format: Document must contain only one H1 heading": "\u65E0\u6548\u683C\u5F0F\uFF1A\u6587\u6863\u5FC5\u987B\u53EA\u5305\u542B\u4E00\u4E2A\u4E00\u7EA7\u6807\u9898",
  "Convert to Slide": "\u628A\u5F53\u524D\u7B14\u8BB0\u8F6C\u6362\u4E3A\u5E7B\u706F\u7247",
  "This file is already a slide presentation": "\u6B64\u6587\u4EF6\u5DF2\u7ECF\u662F\u5E7B\u706F\u7247\u6F14\u793A",
  "Theme Color": "\u4E3B\u9898\u989C\u8272",
  "Set the theme color": "\u8BBE\u7F6E\u5E7B\u706F\u7247\u6F14\u793A\u7684\u4E3B\u9898\u989C\u8272",
  "Slide Mode": "\u5E7B\u706F\u7247\u989C\u8272\u6A21\u5F0F",
  "Set the slide mode": "\u8BBE\u7F6E\u5E7B\u706F\u7247\u6F14\u793A\u7684\u989C\u8272\u6A21\u5F0F",
  "Light Mode": "\u4EAE\u8272\u6A21\u5F0F",
  "Dark Mode": "\u6697\u8272\u6A21\u5F0F",
  "User Designs": "\u7528\u6237\u8BBE\u8BA1",
  "Please select your user design": "\u8BF7\u9009\u62E9\u60A8\u7684\u4E2A\u4EBA\u8BBE\u8BA1",
  "Customized CSS": "\u81EA\u5B9A\u4E49 CSS",
  "User Designs CSS": "\u7528\u6237\u8BBE\u8BA1 CSS",
  "Enable CSS:": "\u542F\u7528 CSS:",
  "User Templates": "\u7528\u6237\u6A21\u677F",
  "Design and Templates": "\u8BBE\u8BA1\u4E0E\u6A21\u7248",
  "Auto Convert Links": "\u81EA\u52A8\u8F6C\u6362\u94FE\u63A5",
  ACLD: "\u81EA\u52A8\u8F6C\u6362\u94FE\u63A5\u4E3A\u652F\u6301Lightbox\u7684\u94FE\u63A5",
  "Enable Paragraph Fragments": "\u542F\u7528\u6BB5\u843D\u788E\u7247\u6548\u679C",
  EPF: "\u4E3A\u6BB5\u843D\u4F7F\u7528\u788E\u7247\u52A8\u753B\u6548\u679C",
  BlankPage: "\u7A7A\u767D",
  ContentPage: "\u5185\u5BB9",
  "Create New Design From Blank": "\u4ECE\u7A7A\u767D\u521B\u5EFA\u65B0\u8BBE\u8BA1",
  "Create New Design From Current Design": "\u4ECE\u73B0\u6709\u8BBE\u8BA1\u521B\u5EFA\u65B0\u8BBE\u8BA1",
  "Please input your design name": "\u8BF7\u8F93\u5165\u60A8\u7684\u8BBE\u8BA1\u540D\u79F0",
  "Cann't find the source folder": "\u65E0\u6CD5\u627E\u5230\u6E90\u6587\u4EF6\u5939\uFF1A",
  "Cann't copy the source file": "\u65E0\u6CD5\u590D\u5236\u6E90\u6587\u4EF6\uFF1A",
  "Error Info": "\u9519\u8BEF\u4FE1\u606F\uFF1A",
  "Cann't create file": "\u65E0\u6CD5\u521B\u5EFA\u6587\u4EF6\uFF1A",
  "Slide Default List": "\u6F14\u793A\u4E2D\u7684\u9ED8\u8BA4\u5217\u8868",
  "Fancy List": "\u7CBE\u7F8E\u5217\u8868",
  "Fancy List Row": "\u7CBE\u7F8E\u5217\u8868\u6574\u884C\u663E\u793A",
  "Fancy List With Order": "\u5E26\u5E8F\u53F7\u7684\u7CBE\u7F8E\u5217\u8868",
  "Fancy List With Order Row": "\u5E26\u5E8F\u53F7\u7684\u7CBE\u7F8E\u5217\u8868\u6574\u884C\u663E\u793A",
  "Grid List": "\u7F51\u683C\u5217\u8868",
  "Grid Step List": "\u7F51\u683C\u6B65\u9AA4\u5217\u8868",
  "Grid Step List Vertical": "\u5782\u76F4\u7F51\u683C\u6B65\u9AA4\u5217\u8868",
  "Box List": "\u65B9\u6846\u5217\u8868",
  "Order List With Border": "\u5E26\u8FB9\u6846\u7684\u6709\u5E8F\u5217\u8868",
  "Default TOC Page List Class": "\u76EE\u5F55\u9875\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Please select the default list class for TOC pages": "\u8BF7\u9009\u62E9\u76EE\u5F55\u9875\u7684\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Default Chapter Page List Class": "\u7AE0\u8282\u9875\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Please select the default list class for chapter pages": "\u8BF7\u9009\u62E9\u7AE0\u8282\u9875\u7684\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Default Content Page List Class": "\u5185\u5BB9\u9875\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Please select the default list class for content pages": "\u8BF7\u9009\u62E9\u5185\u5BB9\u9875\u7684\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Default Blank Page List Class": "\u7A7A\u767D\u9875\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Please select the default list class for blank pages": "\u8BF7\u9009\u62E9\u7A7A\u767D\u9875\u7684\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Default BackCover Page List Class": "\u5C01\u5E95\u9875\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Please select the default list class for backcover page": "\u8BF7\u9009\u62E9\u5C01\u5E95\u9875\u7684\u9ED8\u8BA4\u5217\u8868\u6837\u5F0F",
  "Default Slide Size": "\u9ED8\u8BA4\u5E7B\u706F\u7247\u5C3A\u5BF8",
  "Please select your default slide size": "\u8BF7\u9009\u62E9\u60A8\u7684\u9ED8\u8BA4\u5E7B\u706F\u7247\u5C3A\u5BF8",
  "Presentation 16:9": "\u6F14\u793A 16:9",
  "Presentation 9:16": "\u6F14\u793A 9:16",
  "A4 Vertical": "A4 \u7EB5\u5411",
  "A4 Horizontal": "A4 \u6A2A\u5411",
  "User TOC Page List Class": "\u7528\u6237\u81EA\u5EFA\u76EE\u5F55\u9875\u5217\u8868\u6837\u5F0F",
  "User Chapter Page List Class": "\u7528\u6237\u81EA\u5EFA\u7AE0\u8282\u9875\u5217\u8868\u6837\u5F0F",
  "User Content Page List Class": "\u7528\u6237\u81EA\u5EFA\u5185\u5BB9\u9875\u5217\u8868\u6837\u5F0F",
  "User Blank Page List Class": "\u7528\u6237\u81EA\u5EFA\u7A7A\u767D\u9875\u5217\u8868\u6837\u5F0F",
  "User BackCover Page List Class": "\u7528\u6237\u81EA\u5EFA\u5C01\u5E95\u9875\u5217\u8868\u6837\u5F0F",
  "Set User TOC Page List Class": "\u8BBE\u7F6E\u7528\u6237\u81EA\u5EFA\u76EE\u5F55\u9875\u5217\u8868\u6837\u5F0F",
  "Set User Chapter Page List Class": "\u8BBE\u7F6E\u7528\u6237\u81EA\u5EFA\u7AE0\u8282\u9875\u5217\u8868\u6837\u5F0F",
  "Set User Content Page List Class": "\u8BBE\u7F6E\u7528\u6237\u81EA\u5EFA\u5185\u5BB9\u9875\u5217\u8868\u6837\u5F0F",
  "Set User Blank Page List Class": "\u8BBE\u7F6E\u7528\u6237\u81EA\u5EFA\u7A7A\u767D\u9875\u5217\u8868\u6837\u5F0F",
  "Set User BackCover Page List Class": "\u8BBE\u7F6E\u7528\u6237\u81EA\u5EFA\u5C01\u5E95\u9875\u5217\u8868\u6837\u5F0F",
  "This Action is only available for Paid Users": "\u6B64\u529F\u80FD\u4EC5\u4F9B\u4ED8\u8D39\u7528\u6237\u4F7F\u7528",
  "Content Page Slide Type": "\u5185\u5BB9\u9875\u5E7B\u706F\u7247\u7C7B\u578B",
  "Please select the default slide type for content pages": "\u8BF7\u9009\u62E9\u5185\u5BB9\u9875\u7684\u9ED8\u8BA4\u5E7B\u706F\u7247\u7C7B\u578B",
  Horizontal: "\u6C34\u5E73",
  Vertical: "\u5782\u76F4",
  "Slide Navigation Mode": "\u5E7B\u706F\u7247\u5BFC\u822A\u6A21\u5F0F",
  "Please select the default slide navigation mode": "\u8BF7\u9009\u62E9\u5185\u5BB9\u9875\u7684\u9ED8\u8BA4\u5E7B\u706F\u7247\u5BFC\u822A\u6A21\u5F0F",
  Default: "\u9ED8\u8BA4",
  Linear: "\u7EBF\u6027",
  Grid: "\u7F51\u683C",
  "Default TOC Page Position": "\u9ED8\u8BA4\u76EE\u5F55\u9875\u4F4D\u7F6E",
  "Set Default TOC Page Position": "\u8BBE\u7F6E\u9ED8\u8BA4\u76EE\u5F55\u9875\u4F4D\u7F6E",
  "Convert to Marp Slides": "\u5C06\u5F53\u524D\u7B14\u8BB0\u8F6C\u6362\u4E3A Marp \u5E7B\u706F\u7247",
  "User Specific Frontmatter Options": "\u7528\u6237\u81EA\u5B9A\u4E49 Frontmatter \u9009\u9879",
  "User Customized CSS": "\u7528\u6237\u81EA\u5B9A\u4E49 CSS",
  "Input Your Customized CSS": "\u8F93\u5165\u60A8\u7684\u81EA\u5B9A\u4E49 CSS",
  "Frontmatter Options": "Frontmatter \u9009\u9879",
  "Input Your Frontmatter Options": "\u8F93\u5165\u60A8\u7684 Frontmatter \u9009\u9879",
  "Advanced Slides YAML Reference": "Advanced Slides YAML \u53C2\u8003",
  "Get The Latest Version Of Marp Themes": "\u83B7\u53D6\u6700\u65B0\u7684 Marp \u4E3B\u9898",
  "Marp Themes updated.": "Marp \u4E3B\u9898\u5DF2\u66F4\u65B0\u3002",
  "Add Default Marp Themes for VS Code": "\u4E3A VS Code \u6DFB\u52A0\u9ED8\u8BA4 Marp \u4E3B\u9898",
  "User Customized Marp CSS": "\u7528\u6237\u81EA\u5B9A\u4E49 Marp CSS",
  "Input Your Customized Marp CSS": "\u8F93\u5165\u60A8\u7684\u81EA\u5B9A\u4E49 Marp CSS",
  "Toggle TOC Page Fragments": "\u5207\u6362\u76EE\u5F55\u9875\u7247\u6BB5",
  "Toggle Chapter Page Fragments": "\u5207\u6362\u7AE0\u8282\u9875\u7247\u6BB5",
  "Turn on to use fragments": "\u5F00\u542F\u4EE5\u4F7F\u7528\u7247\u6BB5",
  "List Class Name Added by User": "\u7528\u6237\u6DFB\u52A0\u7684\u5217\u8868\u7C7B\u540D",
  "Columns Class Name Added by User": "\u7528\u6237\u6DFB\u52A0\u7684\u5217\u7C7B\u540D",
  "One Class name each line": "\u6BCF\u884C\u4E00\u4E2A\u7C7B\u540D",
  WithoutNav: "\u65E0\u5BFC\u822A",
  "Turn on Base Layout Nav": "\u5F00\u542F\u5BFC\u822A\u5E03\u5C40",
  "Turn on to use base layout with nav": "\u5F00\u542F\u4EE5\u4F7F\u7528\u5BFC\u822A\u5E03\u5C40",
  SLIDESRUP_SLOGAN: "\u7B80\u5355\u3001\u4F18\u96C5\u4E14\u5F3A\u5927",
  "Separate Nav and TOC": "\u5206\u79BB\u5BFC\u822A\u548C\u76EE\u5F55",
  "Turn on to separate nav and TOC": "\u5F00\u542F\u4EE5\u5206\u79BB\u5BFC\u822A\u548C\u76EE\u5F55",
  Nav: "\u5BFC\u822A",
  "Toggle Chapter and Content Page Heading OBURI": "\u5207\u6362\u7AE0\u8282\u9875\u548C\u5185\u5BB9\u9875\u6807\u9898 OBURI",
  "Turn on to enable Heading OBURI for chapter and content pages": "\u5F00\u542F\u4EE5\u542F\u7528\u7AE0\u8282\u9875\u548C\u5185\u5BB9\u9875\u6807\u9898 OBURI",
  "commentController.replaceClass": "\u66FF\u6362\u7C7B",
  "commentController.anchorHeading": "\u9501\u5B9A\u6807\u9898",
  "commentController.addNotes": "\u6DFB\u52A0\u6CE8\u91CA",
  "commentController.replaceTemplate": "\u66FF\u6362\u6A21\u677F",
  "commentController.addHeadingAliases": "\u6DFB\u52A0\u6807\u9898\u522B\u540D",
  "commentController.appendClass": "\u8FFD\u52A0\u7C7B",
  "commentController.addPageSeparator": "\u6DFB\u52A0\u9875\u9762\u5206\u9694\u7B26",
  "commentController.resetCounter": "\u91CD\u7F6E\u8BA1\u6570\u5668",
  "commentController.useNoNavTemplate": "\u4F7F\u7528\u65E0\u5BFC\u822A\u6A21\u677F",
  "commentController.hideSlide": "\u9690\u85CF\u5E7B\u706F\u7247",
  "commentController.addSlideBackground": "\u6DFB\u52A0\u5E7B\u706F\u7247\u80CC\u666F",
  "blockController.block": "\u666E\u901ABlock",
  "blockController.leftBlock": "\u5DE6\u5BF9\u9F50Block",
  "blockController.centerBlock": "\u5C45\u4E2D\u5BF9\u9F50Block",
  "blockController.rightBlock": "\u53F3\u5BF9\u9F50Block",
  "Get The Latest Version Of Help Docs": "\u83B7\u53D6\u6700\u65B0\u7684\u5E2E\u52A9\u6587\u6863",
  "Help docs updated.": "\u5E2E\u52A9\u6587\u6863\u5DF2\u66F4\u65B0\u3002",
  WithoutComments: "\u65E0\u6CE8\u91CA",
  NoteCreated: "\u7B14\u8BB0\u5DF2\u521B\u5EFA\uFF1A",
  NoteUpdated: "\u7B14\u8BB0\u5DF2\u66F4\u65B0\uFF1A",
  FailedToCreateOrUpdateNote: "\u521B\u5EFA\u6216\u66F4\u65B0\u7B14\u8BB0\u5931\u8D25\uFF1A",
  MakeCopyWithoutComments: "\u521B\u5EFA\u6216\u66F4\u65B0\u5F53\u524D\u6587\u4EF6\u7684\u65E0\u6CE8\u91CA\u526F\u672C",
  "Help documents updated today": "\u4ECA\u5929\u66F4\u65B0\u7684\u5E2E\u52A9\u6587\u6863",
  "Help documents updated in the past week": "\u6700\u8FD1\u4E00\u5468\u66F4\u65B0\u7684\u5E2E\u52A9\u6587\u6863",
  "Help documents updated in the past two weeks": "\u6700\u8FD1\u4E24\u5468\u66F4\u65B0\u7684\u5E2E\u52A9\u6587\u6863",
  "Help documents updated in the past month": "\u6700\u8FD1\u4E00\u4E2A\u6708\u66F4\u65B0\u7684\u5E2E\u52A9\u6587\u6863",
  "All help documents": "\u6240\u6709\u5E2E\u52A9\u6587\u6863",
  "Update User Permissions": "\u66F4\u65B0\u7528\u6237\u6743\u9650",
  "Update User Permissions Success": "\u66F4\u65B0\u7528\u6237\u6743\u9650\u6210\u529F",
  "Update User Permissions Failed": "\u66F4\u65B0\u7528\u6237\u6743\u9650\u5931\u8D25",
  "Updating User Permissions ...": "\u6B63\u5728\u66F4\u65B0\u7528\u6237\u6743\u9650 ...",
  "Slides Saving Location": "\u5E7B\u706F\u7247\u4FDD\u5B58\u4F4D\u7F6E",
  "Slides Basic Settings": "\u5E7B\u706F\u7247\u57FA\u672C\u8BBE\u7F6E",
  "Invalid GitHub repository URL": "\u65E0\u6548\u7684 GitHub \u4ED3\u5E93\u94FE\u63A5",
  "Invalid Gitee repository URL": "\u65E0\u6548\u7684 Gitee \u4ED3\u5E93\u94FE\u63A5",
  "Checking for updates from": "\u6B63\u5728\u68C0\u67E5\u66F4\u65B0\uFF1A",
  "No release found for this repository": "\u672A\u627E\u5230\u6B64\u4ED3\u5E93\u7684\u53D1\u5E03\u7248\u672C",
  "Release is missing manifest.json or main.js. Cannot install.": "\u53D1\u5E03\u7248\u672C\u7F3A\u5C11 manifest.json \u6216 main.js\uFF0C\u65E0\u6CD5\u5B89\u88C5\u3002",
  "Invalid manifest.json: missing 'id' field": "\u65E0\u6548\u7684 manifest.json\uFF1A\u7F3A\u5C11 'id' \u5B57\u6BB5",
  Plugin: "\u63D2\u4EF6",
  "installed/updated successfully": "\u5B89\u88C5/\u66F4\u65B0\u6210\u529F",
  reloaded: "\u5DF2\u91CD\u65B0\u52A0\u8F7D",
  "Automatic reload failed": "\u81EA\u52A8\u91CD\u8F7D\u5931\u8D25",
  "Plugin updated but reload failed": "\u63D2\u4EF6\u5DF2\u66F4\u65B0\uFF0C\u4F46\u81EA\u52A8\u91CD\u8F7D\u5931\u8D25\uFF0C\u8BF7\u624B\u52A8\u91CD\u542F Obsidian \u6216\u91CD\u65B0\u542F\u7528\u63D2\u4EF6\u3002",
  "Plugin installed, please enable manually": "\u63D2\u4EF6\u5B89\u88C5\u5B8C\u6210\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u4E2D\u624B\u52A8\u542F\u7528\u3002",
  "Failed to install plugin": "\u5B89\u88C5\u63D2\u4EF6\u5931\u8D25",
  "Check console for details": "\u8BF7\u67E5\u770B\u63A7\u5236\u53F0\u4E86\u89E3\u8BE6\u60C5",
  "is already up to date": "\u5DF2\u7ECF\u662F\u6700\u65B0\u7248",
  "Current Version": "\u5F53\u524D\u7248\u672C",
  "Check for Updates": "\u68C0\u67E5\u66F4\u65B0",
  "Checking...": "\u6B63\u5728\u68C0\u67E5...",
  "Already up to date": "\u5DF2\u7ECF\u662F\u6700\u65B0\u7248\u672C",
  "Update available": "\u6709\u53EF\u7528\u66F4\u65B0",
  "Start Update": "\u5F00\u59CB\u66F4\u65B0",
  "You are using a development version": "\u60A8\u6B63\u5728\u4F7F\u7528\u5F00\u53D1\u7248\u672C",
  "Failed to check for updates": "\u68C0\u67E5\u66F4\u65B0\u5931\u8D25",
  "Updating...": "\u6B63\u5728\u66F4\u65B0...",
  Updated: "\u66F4\u65B0\u5B8C\u6210",
  "Restart Obsidian to apply changes": "\u91CD\u542F Obsidian \u4EE5\u5E94\u7528\u66F4\u6539",
  "Install IOTO Dashboard": "\u5B89\u88C5IOTO\u4EEA\u8868\u677F",
  "Downloading manifest": "\u6B63\u5728\u4E0B\u8F7D\u6E05\u5355\u6587\u4EF6...",
  "Downloading plugin files": "\u6B63\u5728\u4E0B\u8F7D\u63D2\u4EF6\u6587\u4EF6...",
  PluginIndicator: " (\u63D2\u4EF6)",
  API_Token_Invalid: "API\u5BC6\u94A5\u65E0\u6548",
  "Plugin Download Source": "\u63D2\u4EF6\u4E0B\u8F7D\u6E90",
  "Choose where to download and update plugins": "\u9009\u62E9\u63D2\u4EF6\u4E0B\u8F7D\u548C\u66F4\u65B0\u7684\u6E90",
  GitHub: "GitHub",
  Gitee: "Gitee",
  "Open Design Maker": "\u6253\u5F00 Design Maker",
  "Design Maker": "Design Maker",
  "Enable Design Maker": "\u542F\u7528 Design Maker",
  "Enable the visual Design Maker workspace": "\u542F\u7528\u53EF\u89C6\u5316 Design Maker \u5DE5\u4F5C\u533A",
  "Default Design Maker Base Design": "Design Maker \u9ED8\u8BA4\u57FA\u7840\u8BBE\u8BA1",
  "Please select the default design used by Design Maker": "\u8BF7\u9009\u62E9 Design Maker \u9ED8\u8BA4\u4F7F\u7528\u7684\u57FA\u7840\u8BBE\u8BA1",
  "Show Design Maker Advanced Source Editor": "\u663E\u793A Design Maker \u9AD8\u7EA7\u6E90\u7801\u7F16\u8F91\u5668",
  "Show the fallback source editor in Design Maker": "\u5728 Design Maker \u4E2D\u663E\u793A\u6E90\u7801\u515C\u5E95\u7F16\u8F91\u5668",
  "Auto sync VS Code theme after saving": "\u4FDD\u5B58\u540E\u81EA\u52A8\u540C\u6B65 VS Code \u4E3B\u9898",
  "Sync the Marp theme to VS Code after Design Maker saves": "Design Maker \u4FDD\u5B58\u540E\u540C\u6B65 Marp \u4E3B\u9898\u5230 VS Code",
  "Design Maker Preview Scale": "Design Maker \u9884\u89C8\u7F29\u653E",
  "Adjust the preview scale in Design Maker": "\u8C03\u6574 Design Maker \u4E2D\u7684\u9884\u89C8\u7F29\u653E",
  "Design Maker Slide Base Width": "Design Maker \u903B\u8F91\u57FA\u51C6\u5BBD\u5EA6",
  "Set the logical slide width used by Design Maker rendering": "\u8BBE\u7F6E Design Maker \u6E32\u67D3\u4F7F\u7528\u7684\u903B\u8F91\u5E7B\u706F\u7247\u5BBD\u5EA6",
  "Design Maker Slide Base Height": "Design Maker \u903B\u8F91\u57FA\u51C6\u9AD8\u5EA6",
  "Set the logical slide height used by Design Maker rendering": "\u8BBE\u7F6E Design Maker \u6E32\u67D3\u4F7F\u7528\u7684\u903B\u8F91\u5E7B\u706F\u7247\u9AD8\u5EA6",
  "Design Maker saved": "Design Maker \u5DF2\u4FDD\u5B58",
  "Design already exists": "\u8BBE\u8BA1\u5DF2\u5B58\u5728",
  "Save and Apply": "\u4FDD\u5B58\u5E76\u5E94\u7528",
  "Reload Design": "\u91CD\u65B0\u52A0\u8F7D\u8BBE\u8BA1",
  "Design Pages": "\u8BBE\u8BA1\u9875\u9762",
  "Load Design": "\u5BFC\u5165\u8BBE\u8BA1",
  "Contains source only blocks": "\u5305\u542B\u4EC5\u652F\u6301\u6E90\u7801\u7F16\u8F91\u7684\u533A\u5757",
  "Show Block": "\u663E\u793A\u533A\u5757",
  "Hide Block": "\u9690\u85CF\u533A\u5757",
  "Design Theme": "\u8BBE\u8BA1\u4E3B\u9898",
  "Primary Color": "\u4E3B\u8272",
  "Secondary Color": "\u8F85\u52A9\u8272",
  "Background Color": "\u80CC\u666F\u8272",
  "Text Color": "\u6587\u5B57\u8272",
  "Body Font": "\u6B63\u6587\u5B57\u4F53",
  "Heading Scale": "\u6807\u9898\u7F29\u653E",
  "Body Scale": "\u6B63\u6587\u7F29\u653E",
  "Border Radius": "\u5706\u89D2",
  "Shadow Opacity": "\u9634\u5F71\u900F\u660E\u5EA6",
  "Theme Mode": "\u4E3B\u9898\u6A21\u5F0F",
  "Live Preview": "\u5B9E\u65F6\u9884\u89C8",
  "Block Inspector": "\u533A\u5757\u5C5E\u6027",
  "Select a block": "\u8BF7\u9009\u62E9\u4E00\u4E2A\u533A\u5757",
  "This block is source only": "\u8BE5\u533A\u5757\u4EC5\u652F\u6301\u6E90\u7801\u7F16\u8F91",
  "Block Content": "\u533A\u5757\u5185\u5BB9",
  "CSS Class": "CSS \u7C7B\u540D",
  "Inline Style": "\u5185\u8054\u6837\u5F0F",
  "Page Source": "\u9875\u9762\u6E90\u7801",
  "Apply Source Changes": "\u5E94\u7528\u6E90\u7801\u4FEE\u6539",
  "Theme CSS": "\u4E3B\u9898 CSS",
  "Apply Theme CSS": "\u5E94\u7528\u4E3B\u9898 CSS",
  "Theme CSS updated": "\u4E3B\u9898 CSS \u5DF2\u66F4\u65B0",
  "No design loaded": "\u5F53\u524D\u6CA1\u6709\u52A0\u8F7D\u8BBE\u8BA1",
  "Loading design": "\u6B63\u5728\u52A0\u8F7D\u8BBE\u8BA1...",
  "Failed to load design": "\u52A0\u8F7D\u8BBE\u8BA1\u5931\u8D25\uFF1A",
  "Add Grid": "\u6DFB\u52A0\u7F51\u683C",
  "Add Text": "\u6DFB\u52A0\u6587\u672C",
  "Add Image": "\u6DFB\u52A0\u56FE\u7247",
  "Add Placeholder": "\u6DFB\u52A0\u5360\u4F4D\u7B26",
  "Add Content Slot": "\u6DFB\u52A0\u5185\u5BB9\u69FD\u4F4D",
  "Duplicate Block": "\u590D\u5236\u533A\u5757",
  "Delete Block": "\u5220\u9664\u533A\u5757",
  "Add Footnotes": "\u6DFB\u52A0 Footnotes",
  "Add SR-SideBar": "\u6DFB\u52A0 SR-SideBar",
  "Empty Block": "\u7A7A\u533A\u5757",
  "Create New Design In Design Maker": "\u5728 Design Maker \u4E2D\u65B0\u5EFA\u8BBE\u8BA1",
  "Load Existing Design In Design Maker": "\u5728 Design Maker \u4E2D\u52A0\u8F7D\u73B0\u6709\u8BBE\u8BA1",
  "No existing user designs found": "\u6CA1\u6709\u627E\u5230\u53EF\u52A0\u8F7D\u7684\u7528\u6237\u8BBE\u8BA1",
  "Footnotes block already exists": "Footnotes \u533A\u5757\u5DF2\u5B58\u5728",
  "SR-SideBar block already exists": "SR-SideBar \u533A\u5757\u5DF2\u5B58\u5728",
  Design: "\u8BBE\u8BA1",
  Preview: "\u9884\u89C8",
  "Placeholder Category Layout": "\u5E03\u5C40",
  "Placeholder Category Navigation": "\u5BFC\u822A",
  "Placeholder Category Metadata": "\u5143\u4FE1\u606F",
  "Placeholder Category Branding": "\u54C1\u724C",
  "Placeholder Category Variable": "\u53D8\u91CF",
  X: "X",
  Y: "Y",
  Width: "\u5BBD\u5EA6",
  Height: "\u9AD8\u5EA6",
  Padding: "\u5185\u8FB9\u8DDD",
  Flow: "\u6D41\u5F0F\u5E03\u5C40",
  "Justify Content": "\u5185\u5BB9\u5BF9\u9F50",
  Background: "\u80CC\u666F",
  Border: "\u8FB9\u6846",
  Animation: "\u52A8\u753B",
  Opacity: "\u900F\u660E\u5EA6",
  Rotate: "\u65CB\u8F6C",
  Fragment: "\u52A8\u753B\u987A\u4F4D (Frag)",
  Column: "\u5782\u76F4 (Col)",
  Row: "\u6C34\u5E73 (Row)",
  Left: "\u5DE6\u5BF9\u9F50",
  Right: "\u53F3\u5BF9\u9F50",
  Center: "\u5C45\u4E2D",
  Justify: "\u4E24\u7AEF\u5BF9\u9F50",
  Block: "\u5757\u7EA7",
  Top: "\u9876\u90E8",
  Bottom: "\u5E95\u90E8",
  "Top Left": "\u5DE6\u4E0A",
  "Top Right": "\u53F3\u4E0A",
  "Bottom Left": "\u5DE6\u4E0B",
  "Bottom Right": "\u53F3\u4E0B",
  Stretch: "\u62C9\u4F38",
  Start: "\u8D77\u59CB",
  End: "\u7ED3\u675F",
  "Space Between": "\u4E24\u7AEF\u7A7A\u767D",
  "Space Around": "\u73AF\u7ED5\u7A7A\u767D",
  "Space Evenly": "\u5747\u5300\u7A7A\u767D",
  "Fade In": "\u6DE1\u5165",
  "Fade Out": "\u6DE1\u51FA",
  "Slide Right In": "\u5411\u53F3\u6ED1\u5165",
  "Slide Left In": "\u5411\u5DE6\u6ED1\u5165",
  "Slide Up In": "\u5411\u4E0A\u6ED1\u5165",
  "Slide Down In": "\u5411\u4E0B\u6ED1\u5165",
  "Slide Right Out": "\u5411\u53F3\u6ED1\u51FA",
  "Slide Left Out": "\u5411\u5DE6\u6ED1\u51FA",
  "Slide Up Out": "\u5411\u4E0A\u6ED1\u51FA",
  "Slide Down Out": "\u5411\u4E0B\u6ED1\u51FA",
  "Scale Up": "\u653E\u5927",
  "Scale Up Out": "\u653E\u5927\u5E76\u9000\u51FA",
  "Scale Down": "\u7F29\u5C0F",
  "Scale Down Out": "\u7F29\u5C0F\u5E76\u9000\u51FA",
  Slower: "\u66F4\u6162",
  Faster: "\u66F4\u5FEB",
  Filter: "\u6EE4\u955C",
  Align: "\u5BF9\u9F50"
};

// src/lang/locale/zh-tw.ts
var zh_tw_default = {
  LicensePurchaseInfo: "\u60A8\u9700\u8981\u8CFC\u8CB7\u8A31\u53EF\u8B49\u624D\u80FD\u4F7F\u7528 SlidesRup \u7684\u6240\u6709\u529F\u80FD\u3002\u8ACB\u806F\u7E6B\u4F5C\u8005\u7372\u53D6\u66F4\u591A\u4FE1\u606F\u3002",
  AuthorWechatID: "\u4F5C\u8005\u5FAE\u4FE1ID: johnnylearns",
  "You must provide an API Key to run this command": "\u904B\u884C\u6B64\u547D\u4EE4\u5FC5\u9808\u63D0\u4F9B API \u5BC6\u9470",
  "Get The Latest Version Of Sync Scripts": "\u7372\u53D6\u540C\u6B65\u8173\u672C\u7684\u6700\u65B0\u7248\u672C",
  "Get The Latest Version Of Demo Sync Templates": "\u7372\u53D6\u6F14\u793A\u540C\u6B65\u6A21\u677F\u7684\u6700\u65B0\u7248\u672C",
  "Get Your Personal Sync Templates": "\u7372\u53D6\u60A8\u7684\u500B\u4EBA\u540C\u6B65\u6A21\u677F",
  "Main Setting": "\u4E3B\u8981\u8A2D\u7F6E",
  "Sync Scripts Update API Key": "\u540C\u6B65\u8173\u672C\u66F4\u65B0 API \u5BC6\u9470",
  "Please enter a valid update API Key": "\u8ACB\u8F38\u5165\u6709\u6548\u7684\u66F4\u65B0 API \u5BC6\u9470",
  "Enter the API Key": "\u8F38\u5165API\u5BC6\u9470",
  "Sync Scripts Folder": "\u540C\u6B65\u8173\u672C\u6587\u4EF6\u593E",
  "Please enter the path to the Templater Scripts Folder": "\u8ACB\u8F38\u5165Templater\u8173\u672C\u6587\u4EF6\u593E\u7684\u8DEF\u5F91",
  "Enter the full path to the Templater Scripts folder": "\u8F38\u5165Templater\u8173\u672C\u6587\u4EF6\u593E\u7684\u5B8C\u6574\u8DEF\u5F91",
  "Demo Sync templates Folder": "\u6F14\u793A\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u593E",
  "Please enter the path to the demo sync templates folder": "\u8ACB\u8F38\u5165\u6F14\u793A\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u593E\u7684\u8DEF\u5F91",
  "Enter the path to the demo sync templates folder": "\u8F38\u5165\u6F14\u793A\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u593E\u7684\u8DEF\u5F91",
  "User Templates Setting": "\u7528\u6236\u6A21\u677F\u8A2D\u7F6E",
  "Your Airtable Personal Token": "\u4F60\u7684 Airtable \u500B\u4EBA\u4EE4\u724C",
  "Please enter your personal Aritable token for your sync setting base": "\u8ACB\u8F38\u5165\u60A8\u7528\u65BC\u540C\u6B65\u8A2D\u7F6E\u7684\u500B\u4EBA Aritable \u4EE4\u724C",
  "Enter your personal Airtble token": "\u8F38\u5165\u60A8\u7684\u500B\u4EBAAirtable\u4EE4\u724C",
  "Your Sync Setting Base ID": "\u4F60\u7684\u540C\u6B65\u8A2D\u7F6E\u5EABID",
  "Please enter the base id of your sync setting base": "\u8ACB\u8F38\u5165\u60A8\u7684\u540C\u6B65\u8A2D\u7F6E\u5EAB\u7684\u5EABID",
  "Enter the base id": "\u8F38\u5165\u5EABID",
  "Your Sync Setting Table ID": "\u4F60\u7684\u540C\u6B65\u8A2D\u7F6E\u8868ID",
  "Please enter the table id of your sync setting table": "\u8ACB\u8F38\u5165\u540C\u6B65\u8A2D\u7F6E\u8868\u7684\u8868ID",
  "Enter the table id": "\u8F38\u5165\u8868\u683CID",
  "Your Sync Setting view ID": "\u4F60\u7684\u540C\u6B65\u8A2D\u7F6E\u8996\u5716ID",
  "Please enter the view id of your sync setting table": "\u8ACB\u8F38\u5165\u540C\u6B65\u8A2D\u7F6E\u8868\u7684\u8996\u5716ID",
  "Enter the view id": "\u8F38\u5165\u8996\u5716ID",
  "Your Sync Templates Folder": "\u4F60\u7684\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u593E",
  "Please enter the path to your sync templates folder": "\u8ACB\u8F38\u5165\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u593E\u7684\u8DEF\u5F91",
  "Enter the path to your sync templates folder": "\u8F38\u5165\u540C\u6B65\u6A21\u677F\u6587\u4EF6\u593E\u7684\u8DEF\u5F91",
  "Updating, plese wait for a moment": "\u6B63\u5728\u66F4\u65B0\uFF0C\u8ACB\u7A0D\u5019",
  "Your API Key was expired. Please get a new one.": "\u4F60\u7684API\u5BC6\u9470\u5DF2\u904E\u671F\uFF0C\u8ACB\u7372\u53D6\u65B0\u7684\u5BC6\u9470",
  Got: "\u5DF2\u7372\u53D6",
  records: "\u8A18\u9304",
  "Getting Data \u2026\u2026": "\u6B63\u5728\u7372\u53D6\u6578\u64DA\u2026\u2026",
  "files needed to be updated or created.": "\u9700\u8981\u66F4\u65B0\u6216\u5275\u5EFA\u7684\u6587\u4EF6",
  "Failed to write file: ": "\u5BEB\u5165\u6587\u4EF6\u5931\u6557\uFF1A",
  "There are": "\u9084\u6709",
  "files needed to be processed.": "\u9700\u8981\u8655\u7406\u7684\u6587\u4EF6",
  "All Finished.": "\u5168\u90E8\u5B8C\u6210",
  "Your Sync Setting URL": "\u4F60\u7684\u540C\u6B65\u8A2D\u5B9A\u8868\u7684Airtable\u9023\u7D50",
  "Please enter the url of your sync setting table": "\u8ACB\u8F38\u5165\u4F60\u7684\u540C\u6B65\u8A2D\u5B9A\u8868\u7684Airtable\u9023\u7D50",
  "Enter the url": "\u8ACB\u8F38\u5165\u9023\u7D50",
  "Your Email Address": "\u4F60\u7684\u96FB\u5B50\u90F5\u4EF6\u5730\u5740",
  "Please enter the email you provided when you purchase this product": "\u8ACB\u8F38\u5165\u60A8\u8CFC\u8CB7\u6B64\u7522\u54C1\u6642\u63D0\u4F9B\u7684\u96FB\u5B50\u90F5\u4EF6\u5730\u5740",
  "Enter your email": "\u8F38\u5165\u4F60\u7684\u96FB\u5B50\u90F5\u4EF6",
  "When you use the sync with online database feature of IOTO, the sync configration generater I built could help you a lot.": "\u7576\u4F60\u4F7F\u7528IOTO\u7684\u7DDA\u4E0A\u8CC7\u6599\u5EAB\u540C\u6B65\u529F\u80FD\u6642\uFF0C\u6211\u5EFA\u7ACB\u7684\u540C\u6B65\u914D\u7F6E\u751F\u6210\u5668\u53EF\u4EE5\u5E6B\u4F60\u5F88\u591A",
  "You can use the following link to open the shared base and save it to your own Airtable workspace.": "\u4F60\u53EF\u4EE5\u4F7F\u7528\u4EE5\u4E0B\u9023\u7D50\u6253\u958B\u5171\u4EAB\u5EAB\u4E26\u5C07\u5176\u5132\u5B58\u5230\u4F60\u81EA\u5DF1\u7684Airtable\u5DE5\u4F5C\u5340",
  "Sync Configration Generator": "\u540C\u6B65\u914D\u7F6E\u751F\u6210\u5668",
  "You can watch the follow video to find out how to use this sync configration base.": "\u4F60\u53EF\u4EE5\u89C0\u770B\u4EE5\u4E0B\u5F71\u7247\u4E86\u89E3\u5982\u4F55\u4F7F\u7528\u9019\u500B\u540C\u6B65\u914D\u7F6E\u5EAB",
  "How to use the sync configration generator": "\u540C\u6B65\u914D\u7F6E\u751F\u6210\u5668\u7528\u6CD5\u793A\u7BC4",
  "In order to help you to learn how to use the sync with online database feature, I will keep posting instructions and videos to the following link.": "\u70BA\u4E86\u5E6B\u52A9\u4F60\u5B78\u7FD2\u5982\u4F55\u4F7F\u7528\u8207\u7DDA\u4E0A\u8CC7\u6599\u5EAB\u540C\u6B65\u7684\u529F\u80FD\uFF0C\u6211\u5C07\u4E0D\u65B7\u767C\u5E03\u76F8\u95DC\u6559\u7A0B\u548C\u8996\u983B\u5230\u4EE5\u4E0B\u93C8\u63A5\u3002",
  "OB Sync With MDB How To Guide": "OB Sync With MDB \u4F7F\u7528\u6559\u7A0B",
  "Validating...": "\u6B63\u5728\u9A57\u8B49...",
  "Valid API Key": "\u6709\u6548API\u5BC6\u9470",
  "Valid Email": "\u6709\u6548\u96FB\u5B50\u90F5\u4EF6",
  Valid: "\u9A57\u8B49\u901A\u904E",
  "SlidesRup Update API Key": "SlidesRup \u66F4\u65B0 API \u91D1\u9470",
  "SlidesRup Framework Folder": "SlidesRup \u6846\u67B6\u8CC7\u6599\u593E",
  "SlidesRup Framework Folder Description": "SlidesRup \u6846\u67B6\u8CC7\u6599\u593E\u8AAA\u660E",
  "Get The Latest Version Of Style": "\u7372\u53D6\u6700\u65B0\u7248\u672C\u7684\u6A23\u5F0F",
  "Get The Latest Version Of Templates": "\u7372\u53D6\u6700\u65B0\u7248\u672C\u7684\u8A2D\u8A08\u6A21\u677F",
  "Get The Latest Version Of User Templates": "\u7372\u53D6\u6700\u65B0\u7684\u7528\u6236\u6F14\u793A\u6A21\u677F",
  "One Click to Deploy": "\u4E00\u9375\u90E8\u7F72",
  "Please enter the path to the SlidesRup Framework Folder": "\u8ACB\u8F38\u5165 SlidesRup \u6846\u67B6\u8CC7\u6599\u593E\u7684\u8DEF\u5F91",
  "Enter the full path to the SlidesRup Framework folder": "\u8F38\u5165 SlidesRup \u6846\u67B6\u8CC7\u6599\u593E\u7684\u5B8C\u6574\u8DEF\u5F91",
  "Create New Slides": "\u5EFA\u7ACB\u65B0\u7684\u7C21\u5831",
  "Slide Design A": "\u7C21\u5831\u8A2D\u8A08A",
  "Slide Design B": "\u7C21\u5831\u8A2D\u8A08B",
  "Slide Design C": "\u7C21\u5831\u8A2D\u8A08C",
  "Slide Design D": "\u7C21\u5831\u8A2D\u8A08D",
  "Slide Design E": "\u7C21\u5831\u8A2D\u8A08E",
  "Slide Design F": "\u7C21\u5831\u8A2D\u8A08F",
  "Slide Design G": "\u7C21\u5831\u8A2D\u8A08G",
  "Slide Design H": "\u7C21\u5831\u8A2D\u8A08H",
  "Slide Design": "\u7C21\u5831\u8A2D\u8A08",
  "Please select a slide design": "\u8ACB\u9078\u64C7\u7C21\u5831\u8A2D\u8A08",
  "New Slide": "\u65B0\u7C21\u5831",
  "Untitled Slide": "\u7121\u984C\u7C21\u5831",
  "Current Folder": "\u7576\u524D\u8CC7\u6599\u593E",
  "User Assigned Folder": "\u4F7F\u7528\u8005\u6307\u5B9A\u8CC7\u6599\u593E",
  "Select Location": "\u9078\u64C7\u4F4D\u7F6E",
  "Default New Slide Location": "\u9810\u8A2D\u65B0\u7C21\u5831\u4F4D\u7F6E",
  "Please enter the path to the default new slide location": "\u8ACB\u8F38\u5165\u9810\u8A2D\u65B0\u7C21\u5831\u4F4D\u7F6E\u7684\u8DEF\u5F91",
  "Enter the full path to the default new slide location": "\u8F38\u5165\u9810\u8A2D\u65B0\u7C21\u5831\u4F4D\u7F6E\u7684\u5B8C\u6574\u8DEF\u5F91",
  "New Slide Location Option": "\u65B0\u7C21\u5831\u4F4D\u7F6E\u9078\u9805",
  "Please select the default new slide location option": "\u8ACB\u9078\u64C7\u9810\u8A2D\u65B0\u7C21\u5831\u4F4D\u7F6E\u9078\u9805",
  "Decide At Creation": "\u5EFA\u7ACB\u6642\u6C7A\u5B9A",
  Cover: "\u5C01\u9762",
  Chapter: "\u7AE0\u7BC0",
  TOC: "\u76EE\u9304",
  BackCover: "\u5C01\u5E95",
  BaseLayout: "\u57FA\u672C\u4F48\u5C40",
  SubSlide: "\u5B50\u9801\u9762",
  List: "\u5217\u8868",
  SubList: "\u5B50\u5217\u8868",
  "Use SlidesRup to Express Yourself": "\u7528SlidesRup\u8868\u9054\u81EA\u5DF1",
  Farewell: "\u518D\u6703",
  "Content is the king": "\u5167\u5BB9\u70BA\u738B",
  "Focus on the basic first": "\u95DC\u6CE8\u57FA\u672C",
  "Operation cancelled by user": "\u7528\u6236\u53D6\u6D88\u64CD\u4F5C",
  "Starting one-click deployment...": "\u6B63\u5728\u4E00\u952E\u90E8\u7F72...",
  "Styles updated.": "\u6A23\u5F0F\u5DF2\u66F4\u65B0\u3002",
  "Templates updated.": "\u6A21\u677F\u5DF2\u66F4\u65B0\u3002",
  "Demo slides updated.": "\u6F14\u793A\u793A\u4F8B\u5DF2\u66F4\u65B0\u3002",
  "One-click deployment finished!": "\u4E00\u952E\u90E8\u7F72\u5B8C\u6210\uFF01",
  "Default Design": "\u9810\u8A2D\u8A2D\u8A08",
  "Please select your default design": "\u8ACB\u9078\u64C7\u4F60\u7684\u9810\u8A2D\u8A2D\u8A08",
  None: "\u7121",
  "Add Chapter": "\u65B0\u589E\u7AE0\u7BC0",
  "Add Page": "\u65B0\u589E\u5167\u5BB9\u9801",
  "User Templates Folder": "\u4F60\u7684\u6A21\u677F\u8CC7\u6599\u593E",
  "Please enter the path to your own templates": "\u8ACB\u9078\u64C7\u4F60\u7684\u6A21\u677F\u8CC7\u6599\u593E\u8DEF\u5F91",
  "Choose your templates folder": "\u9078\u64C7\u4F60\u7684\u6A21\u677F\u8CC7\u6599\u593E",
  "User Slide Template": "\u4F60\u7684\u7C21\u5831\u6A21\u677F",
  "Please choose your personal slide template": "\u8ACB\u9078\u64C7\u4F60\u7684\u7C21\u5831\u6A21\u677F\u6A94\u6848",
  "Choose your personal slide template": "\u9078\u64C7\u4F60\u7684\u7C21\u5831\u6A21\u677F",
  "User Chapter Template": "\u4F60\u7684\u7AE0\u7BC0\u6A21\u677F",
  "Please choose your personal chapter template": "\u8ACB\u9078\u64C7\u4F60\u7684\u7AE0\u7BC0\u6A21\u677F\u6A94\u6848",
  "Choose your personal chapter template": "\u9078\u64C7\u4F60\u7684\u7AE0\u7BC0\u6A21\u677F",
  "User Page Template": "\u4F60\u7684\u5167\u5BB9\u9801\u6A21\u677F",
  "Please choose your personal page template": "\u8ACB\u9078\u64C7\u4F60\u7684\u5167\u5BB9\u9801\u6A21\u677F\u6A94\u6848",
  "Choose your personal page template": "\u9078\u64C7\u4F60\u7684\u5167\u5BB9\u9801\u6A21\u677F",
  "Color Setting": "\u984F\u8272\u8A2D\u5B9A",
  Hue: "\u8272\u76F8",
  Saturation: "\u98FD\u548C\u5EA6",
  Lightness: "\u4EAE\u5EA6",
  "Preview Your Slide Theme Color": "\u9810\u89BD\u4F60\u7684\u7C21\u5831\u4E3B\u984C\u8272",
  "Adjust the hue of the theme": "\u8ABF\u6574\u4E3B\u984C\u8272\u7684\u8272\u76F8",
  "Adjust the saturation of the theme": "\u8ABF\u6574\u4E3B\u984C\u8272\u7684\u98FD\u548C\u5EA6",
  "Adjust the lightness of the theme": "\u8ABF\u6574\u4E3B\u984C\u8272\u7684\u4EAE\u5EA6",
  "Get The Latest Version SlidesRup Reveal Addons": "\u7372\u53D6\u6700\u65B0\u7684SlidesRup Reveal\u6846\u67B6\u64F4\u5145\u6A94\u6848",
  "Reveal template updated.": "Reveal\u6A21\u677F\u5DF2\u66F4\u65B0",
  "User TOC Template": "\u7528\u6236\u7C21\u5831\u76EE\u9304\u6A21\u677F",
  "Please choose your personal TOC template": "\u8ACB\u9078\u64C7\u4F60\u7684\u7C21\u5831\u76EE\u9304\u6A21\u677F",
  "Choose your personal TOC template": "\u9078\u64C7\u4F60\u7684\u7C21\u5831\u76EE\u9304\u6A21\u677F",
  Slide: "\u7C21\u5831",
  "User Base Layout Template": "\u4F60\u7684\u57FA\u672C\u4F48\u5C40\u6A21\u677F",
  "Please choose your personal base layout template": "\u8ACB\u9078\u64C7\u4F60\u7684\u57FA\u672C\u4F48\u5C40\u6A21\u677F",
  "Choose your personal base layout template": "\u9078\u64C7\u4F60\u7684\u57FA\u672C\u4F48\u5C40\u6A21\u677F",
  Confirm: "\u78BA\u8A8D",
  Cancel: "\u53D6\u6D88",
  "Please input slide name": "\u8ACB\u8F38\u5165\u7C21\u5831\u540D\u7A31",
  "Please input slide folder name": "\u8ACB\u8F38\u5165\u7C21\u5831\u8CC7\u6599\u593E\u540D\u7A31",
  "Customize Slide Folder Name": "\u81EA\u8A02\u7C21\u5831\u8CC7\u6599\u593E\u540D\u7A31",
  "Use Customize Slide Folder Name": "\u4F7F\u7528\u81EA\u8A02\u7684\u7C21\u5831\u8CC7\u6599\u593E\u540D\u7A31",
  "Slide Settings": "\u7C21\u5831\u8A2D\u5B9A",
  Tagline: "Logo \u6216 \u6A19\u8A9E",
  "Set Tagline": "\u8A2D\u5B9A Logo \u6216 \u6A19\u8A9E",
  "Your Tagline": "\u4F60\u7684 Logo \u6216 \u6A19\u8A9E",
  Slogan: "\u53E3\u865F",
  "Set Slogan": "\u8A2D\u5B9A\u53E3\u865F",
  "Your Slogan": "\u4F60\u7684\u53E3\u865F",
  Presenter: "\u6F14\u8B1B\u8005",
  "Set Presenter": "\u8A2D\u5B9A\u6F14\u8B1B\u8005",
  "Date Format": "\u65E5\u671F\u683C\u5F0F",
  "Set Date Format": "\u8A2D\u5B9A\u65E5\u671F\u683C\u5F0F",
  "Your Date Format": "\u4F60\u7684\u65E5\u671F\u683C\u5F0F",
  "Please input chapter index number": "\u8ACB\u8F38\u5165\u7AE0\u7BC0\u7D22\u5F15\u865F",
  "Please input chapter name": "\u8ACB\u8F38\u5165\u7AE0\u7BC0\u540D\u7A31",
  "Please input page index number": "\u8ACB\u8F38\u5165\u5167\u5BB9\u9801\u7D22\u5F15\u865F",
  "Add Sub Pages When Add Chapter": "\u65B0\u589E\u7AE0\u7BC0\u6642\u540C\u6642\u65B0\u589E\u5B50\u9801\u9762",
  "User Chapter With Sub Pages Template": "\u4F60\u7684\u5305\u542B\u5B50\u9801\u9762\u7684\u7AE0\u7BC0\u6A21\u677F",
  "Please choose your personal chapter with sub pages template": "\u8ACB\u9078\u64C7\u4F60\u7684\u5305\u542B\u5B50\u9801\u9762\u7684\u7AE0\u7BC0\u6A21\u677F",
  "Choose your personal chapter with sub pages template": "\u9078\u64C7\u4F60\u7684\u5305\u542B\u5B50\u9801\u9762\u7684\u7AE0\u7BC0\u6A21\u677F",
  "Enable User Templates": "\u555F\u7528\u7528\u6236\u6A21\u677F",
  SlidesRup_Settings_Heading: "SlidesRup\u8A2D\u5B9A",
  "SlidesRup Running Language": "SlidesRup\u904B\u884C\u8A9E\u8A00",
  "Please select your slidesRup framework running language": "\u8ACB\u9078\u64C7\u4F60\u7684SlidesRup\u6846\u67B6\u904B\u884C\u8A9E\u8A00",
  "Auto (Follow System Language)": "\u81EA\u52D5\uFF08\u8DDF\u96A8\u7CFB\u7D71\u8A9E\u8A00\uFF09",
  Chinese: "\u7C21\u9AD4\u4E2D\u6587",
  "Chinses Traditional": "\u7E41\u9AD4\u4E2D\u6587",
  "Reload OB": "\u91CD\u65B0\u52A0\u8F09",
  "Presentation Plugin": "\u6F14\u793A\u63D2\u4EF6",
  "Please select your presentation plugin": "\u8ACB\u9078\u64C7\u4F60\u7684\u6F14\u793A\u63D2\u4EF6",
  "Font Setting": "\u5B57\u9AD4\u5B57\u865F\u8A2D\u5B9A",
  "Heading Font": "\u6A19\u984C\u5B57\u9AD4",
  "Set Heading Font": "\u8A2D\u5B9A\u6A19\u984C\u5B57\u9AD4",
  "Main Font": "\u6B63\u6587\u5B57\u9AD4",
  "Set Main Font": "\u8A2D\u5B9A\u6B63\u6587\u5B57\u9AD4",
  "Your Heading Font": "\u4F60\u7684\u6A19\u984C\u5B57\u9AD4",
  "H1 Font": "H1 \u5B57\u9AD4",
  "H2 Font": "H2 \u5B57\u9AD4",
  "H3 Font": "H3 \u5B57\u9AD4",
  "H4 Font": "H4 \u5B57\u9AD4",
  "H5 Font": "H5 \u5B57\u9AD4",
  "H6 Font": "H6 \u5B57\u9AD4",
  "Tagline Font": "\u6807\u8BED\u5B57\u9AD4",
  "Slogan Font": "\u53E3\u53F7\u5B57\u9AD4",
  "Nav Font": "\u5C0E\u822A\u5B57\u9AD4",
  "Set H1 Font": "\u8A2D\u5B9A H1 \u5B57\u9AD4",
  "Set H2 Font": "\u8A2D\u5B9A H2 \u5B57\u9AD4",
  "Set H3 Font": "\u8A2D\u5B9A H3 \u5B57\u9AD4",
  "Set H4 Font": "\u8A2D\u5B9A H4 \u5B57\u9AD4",
  "Set H5 Font": "\u8A2D\u5B9A H5 \u5B57\u9AD4",
  "Set H6 Font": "\u8A2D\u5B9A H6 \u5B57\u9AD4",
  "Set Tagline Font": "\u8A2D\u5B9A\u6807\u8BED\u5B57\u9AD4",
  "Set Slogan Font": "\u8A2D\u5B9A\u53E3\u53F7\u5B57\u9AD4",
  "Set Nav Font": "\u8A2D\u5B9A\u5C0E\u822A\u5B57\u9AD4",
  "H1 Size": "H1 \u5B57\u865F",
  "H2 Size": "H2 \u5B57\u865F",
  "H3 Size": "H3 \u5B57\u865F",
  "H4 Size": "H4 \u5B57\u865F",
  "H5 Size": "H5 \u5B57\u865F",
  "H6 Size": "H6 \u5B57\u865F",
  "Tagline Size": "\u6807\u8BED\u5B57\u865F",
  "Slogan Size": "\u53E3\u53F7\u5B57\u865F",
  "Nav Size": "\u5C0E\u822A\u5B57\u865F",
  "Set H1 Size": "\u8A2D\u5B9A H1 \u5B57\u865F",
  "Set H2 Size": "\u8A2D\u5B9A H2 \u5B57\u865F",
  "Set H3 Size": "\u8A2D\u5B9A H3 \u5B57\u865F",
  "Set H4 Size": "\u8A2D\u5B9A H4 \u5B57\u865F",
  "Set H5 Size": "\u8A2D\u5B9A H5 \u5B57\u865F",
  "Set H6 Size": "\u8A2D\u5B9A H6 \u5B57\u865F",
  "Set Tagline Size": "\u8A2D\u5B9A\u6807\u8BED\u5B57\u865F",
  "Set Slogan Size": "\u8A2D\u5B9A\u53E3\u53F7\u5B57\u865F",
  "Set Nav Size": "\u8A2D\u5B9A\u5C0E\u822A\u5B57\u865F",
  "Adjust the font size of H1": "\u8ABF\u6574 H1 \u6A19\u984C\u5B57\u865F",
  "Adjust the font size of H2": "\u8ABF\u6574 H2 \u6A19\u984C\u5B57\u865F",
  "Adjust the font size of H3": "\u8ABF\u6574 H3 \u6A19\u984C\u5B57\u865F",
  "Adjust the font size of H4": "\u8ABF\u6574 H4 \u6A19\u984C\u5B57\u865F",
  "Adjust the font size of H5": "\u8ABF\u6574 H5 \u6A19\u984C\u5B57\u865F",
  "Adjust the font size of H6": "\u8ABF\u6574 H6 \u6A19\u984C\u5B57\u865F",
  "Adjust the font size of Tagline": "\u8ABF\u6574\u6807\u8BED\u5B57\u865F",
  "Adjust the font size of Slogan": "\u8ABF\u6574\u53E3\u53F7\u5B57\u865F",
  "Adjust the font size of Nav": "\u8ABF\u6574\u5C0E\u822A\u5B57\u865F",
  "Font Family": "\u5B57\u9AD4",
  "Font Size": "\u5B57\u865F",
  "Body Size": "\u6B63\u6587\u5B57\u865F",
  "Adjust the font size of body": "\u8ABF\u6574\u6B63\u6587\u5B57\u865F",
  "Text Transform": "\u6587\u5B57\u8B8A\u63DB",
  "Heading Text Transform": "\u6A19\u984C\u6587\u5B57\u8B8A\u63DB",
  "Set text transform for all headings": "\u8A2D\u5B9A\u6240\u6709\u6A19\u984C\u7684\u6587\u5B57\u8B8A\u63DB",
  "Heading Colors": "\u6A19\u984C\u984F\u8272",
  "H1 Color": "H1 \u984F\u8272",
  "H2 Color": "H2 \u984F\u8272",
  "H3 Color": "H3 \u984F\u8272",
  "H4 Color": "H4 \u984F\u8272",
  "H5 Color": "H5 \u984F\u8272",
  "H6 Color": "H6 \u984F\u8272",
  "Set the color for H1 headings": "\u8A2D\u5B9A H1 \u6A19\u984C\u7684\u984F\u8272",
  "Set the color for H2 headings": "\u8A2D\u5B9A H2 \u6A19\u984C\u7684\u984F\u8272",
  "Set the color for H3 headings": "\u8A2D\u5B9A H3 \u6A19\u984C\u7684\u984F\u8272",
  "Set the color for H4 headings": "\u8A2D\u5B9A H4 \u6A19\u984C\u7684\u984F\u8272",
  "Set the color for H5 headings": "\u8A2D\u5B9A H5 \u6A19\u984C\u7684\u984F\u8272",
  "Set the color for H6 headings": "\u8A2D\u5B9A H6 \u6A19\u984C\u7684\u984F\u8272",
  "Header Colors": "\u6A19\u982D\u984F\u8272",
  "Tagline Color": "\u6A19\u8A9E\u984F\u8272",
  "Set the color for tagline text": "\u8A2D\u5B9A\u6A19\u8A9E\u6587\u5B57\u7684\u984F\u8272",
  "Slogan Color": "\u53E3\u865F\u984F\u8272",
  "Set the color for slogan text": "\u8A2D\u5B9A\u53E3\u865F\u6587\u5B57\u7684\u984F\u8272",
  "Nav Color": "\u5C0E\u822A\u984F\u8272",
  "Set the color for navigation text": "\u8A2D\u5B9A\u5C0E\u822A\u6587\u5B57\u7684\u984F\u8272",
  "Body Colors": "\u6B63\u6587\u984F\u8272",
  "Body Color": "\u6B63\u6587\u984F\u8272",
  "Paragraph Color": "\u6BB5\u843D\u984F\u8272",
  "List Color": "\u5217\u8868\u984F\u8272",
  "Strong Color": "\u5F37\u8ABF\u984F\u8272",
  "Emphasis Color": "\u659C\u9AD4\u984F\u8272",
  "Link Color": "\u9023\u7D50\u984F\u8272",
  "Set the color for body text": "\u8A2D\u5B9A\u6B63\u6587\u6587\u5B57\u7684\u984F\u8272",
  "Set the color for paragraphs": "\u8A2D\u5B9A\u6BB5\u843D\u7684\u984F\u8272",
  "Set the color for lists": "\u8A2D\u5B9A\u5217\u8868\u7684\u984F\u8272",
  "Set the color for strong/bold text": "\u8A2D\u5B9A\u7C97\u9AD4\u6587\u5B57\u7684\u984F\u8272",
  "Set the color for emphasis/italic text": "\u8A2D\u5B9A\u659C\u9AD4\u6587\u5B57\u7684\u984F\u8272",
  "Set the color for links": "\u8A2D\u5B9A\u9023\u7D50\u7684\u984F\u8272",
  "Theme Colors": "\u4E3B\u984C\u984F\u8272",
  Capitalize: "\u9996\u5B57\u6BCD\u5927\u5BEB",
  Uppercase: "\u5168\u90E8\u5927\u5BEB",
  Lowercase: "\u5168\u90E8\u5C0F\u5BEB",
  "Use User Color Setting": "\u4F7F\u7528\u7528\u6236\u984F\u8272\u8A2D\u7F6E",
  "Use User Font Family Setting": "\u4F7F\u7528\u7528\u6236\u5B57\u9AD4\u8A2D\u7F6E",
  "Use User Font Size Setting": "\u4F7F\u7528\u7528\u6236\u5B57\u865F\u8A2D\u7F6E",
  "Use Default Value": "\u4F7F\u7528\u9810\u8A2D\u503C",
  "Customize Text Colors": "\u81EA\u8A02\u6587\u5B57\u984F\u8272",
  "Advanced Settings": "\u9032\u968E\u8A2D\u7F6E",
  "Use User Customized CSS": "\u4F7F\u7528\u7528\u6236\u81EA\u8A02 CSS",
  "Enable User Customized CSS": "\u555F\u7528\u7528\u6236\u81EA\u8A02 CSS",
  "Enable User Font Family Setting": "\u555F\u7528\u7528\u6236\u5B57\u9AD4\u8A2D\u7F6E",
  "Enable User Font Size Setting": "\u555F\u7528\u7528\u6236\u5B57\u865F\u8A2D\u7F6E",
  "Enable User Color Setting": "\u555F\u7528\u7528\u6236\u984F\u8272\u8A2D\u7F6E",
  "Invalid Format: No headings found": "\u7121\u6548\u683C\u5F0F\uFF1A\u672A\u627E\u5230\u6A19\u984C",
  "Invalid Format: Document must contain H1 headings": "\u7121\u6548\u683C\u5F0F\uFF1A\u6587\u4EF6\u5FC5\u9808\u5305\u542B\u4E00\u865F\u6A19\u984C",
  "No active editor, can't excute this command.": "\u6C92\u6709\u6D3B\u52D5\u7DE8\u8F2F\u5668\uFF0C\u7121\u6CD5\u57F7\u884C\u6B64\u547D\u4EE4\u3002",
  "Invalid Format: Document must contain only one H1 heading": "\u7121\u6548\u683C\u5F0F\uFF1A\u6587\u4EF6\u5FC5\u9808\u53EA\u5305\u542B\u4E00\u500B\u4E00\u7EA7\u6A19\u984C",
  "Convert to Slide": "\u628A\u7576\u524D\u7B46\u8A18\u8F49\u63DB\u70BA\u5E7B\u71C8\u7247",
  "This file is already a slide presentation": "\u6B64\u6587\u4EF6\u5DF2\u7D93\u662F\u5E7B\u71C8\u7247\u6F14\u793A",
  "Theme Color": "\u4E3B\u984C\u984F\u8272",
  "Set the theme color": "\u8A2D\u5B9A\u5E7B\u71C8\u7247\u6F14\u793A\u7684\u4E3B\u984C\u984F\u8272",
  "Slide Mode": "\u5E7B\u71C8\u7247\u984F\u8272\u6A21\u5F0F",
  "Set the slide mode": "\u8A2D\u5B9A\u5E7B\u71C8\u7247\u6F14\u793A\u7684\u984F\u8272\u6A21\u5F0F",
  "Light Mode": "\u4EAE\u8272\u6A21\u5F0F",
  "Dark Mode": "\u6697\u8272\u6A21\u5F0F",
  "User Designs": "\u7528\u6236\u8A2D\u8A08",
  "Please select your user design": "\u8ACB\u9078\u64C7\u4F60\u7684\u500B\u4EBA\u8A2D\u8A08",
  "Customized CSS": "\u81EA\u8A02 CSS",
  "User Designs CSS": "\u7528\u6236\u8A2D\u8A08 CSS",
  "Enable CSS:": "\u555F\u7528 CSS:",
  "User Templates": "\u7528\u6236\u6A21\u677F",
  "Design and Templates": "\u8A2D\u8A08\u8207\u6A21\u677F",
  "Auto Convert Links": "\u81EA\u52D5\u8F49\u63DB\u9023\u7D50",
  ACLD: "\u81EA\u52D5\u8F49\u63DB\u9023\u7D50\u70BA\u652F\u6301 Lightbox \u7684\u9023\u7D50",
  "Enable Paragraph Fragments": "\u555F\u7528\u6BB5\u843D\u788E\u7247\u6548\u679C",
  EPF: "\u70BA\u6BB5\u843D\u4F7F\u7528\u788E\u7247\u52D5\u756B\u6548\u679C",
  BlankPage: "\u7A7A\u767D",
  ContentPage: "\u5167\u5BB9",
  "Create New Design From Blank": "\u5F9E\u7A7A\u767D\u5EFA\u7ACB\u65B0\u8A2D\u8A08",
  "Create New Design From Current Design": "\u5F9E\u73FE\u6709\u8A2D\u8A08\u5EFA\u7ACB\u65B0\u8A2D\u8A08",
  "Please input your design name": "\u8ACB\u8F38\u5165\u60A8\u7684\u8A2D\u8A08\u540D\u7A31",
  "Cann't find the source folder": "\u7121\u6CD5\u627E\u5230\u4F86\u6E90\u8CC7\u6599\u593E\uFF1A",
  "Cann't copy the source file": "\u7121\u6CD5\u8907\u88FD\u4F86\u6E90\u6A94\u6848\uFF1A",
  "Error Info": "\u932F\u8AA4\u8CC7\u8A0A\uFF1A",
  "Cann't create file": "\u7121\u6CD5\u5EFA\u7ACB\u6A94\u6848\uFF1A",
  "Slide Default List": "\u6F14\u793A\u4E2D\u7684\u9810\u8A2D\u5217\u8868",
  "Fancy List": "\u7CBE\u7F8E\u5217\u8868",
  "Fancy List Row": "\u7CBE\u7F8E\u5217\u8868\u6574\u884C\u986F\u793A",
  "Fancy List With Order": "\u5E36\u5E8F\u865F\u7684\u7CBE\u7F8E\u5217\u8868",
  "Fancy List With Order Row": "\u5E36\u5E8F\u865F\u7684\u7CBE\u7F8E\u5217\u8868\u6574\u884C\u986F\u793A",
  "Grid List": "\u7DB2\u683C\u5217\u8868",
  "Grid Step List": "\u7DB2\u683C\u6B65\u9A5F\u5217\u8868",
  "Grid Step List Vertical": "\u5782\u76F4\u7DB2\u683C\u6B65\u9A5F\u5217\u8868",
  "Box List": "\u65B9\u6846\u5217\u8868",
  "Order List With Border": "\u5E36\u908A\u6846\u7684\u6709\u5E8F\u5217\u8868",
  "Default TOC Page List Class": "\u76EE\u9304\u9801\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Please select the default list class for TOC pages": "\u8ACB\u9078\u64C7\u76EE\u9304\u9801\u7684\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Default Chapter Page List Class": "\u7AE0\u7BC0\u9801\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Please select the default list class for chapter pages": "\u8ACB\u9078\u64C7\u7AE0\u7BC0\u9801\u7684\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Default Content Page List Class": "\u5167\u5BB9\u9801\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Please select the default list class for content pages": "\u8ACB\u9078\u64C7\u5167\u5BB9\u9801\u7684\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Default Blank Page List Class": "\u7A7A\u767D\u9801\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Please select the default list class for blank pages": "\u8ACB\u9078\u64C7\u7A7A\u767D\u9801\u7684\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Default BackCover Page List Class": "\u5C01\u5E95\u9801\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Please select the default list class for backcover page": "\u8ACB\u9078\u64C7\u5C01\u5E95\u9801\u7684\u9810\u8A2D\u5217\u8868\u6A23\u5F0F",
  "Default Slide Size": "\u9810\u8A2D\u7C21\u5831\u5C3A\u5BF8",
  "Please select your default slide size": "\u8ACB\u9078\u64C7\u60A8\u7684\u9810\u8A2D\u7C21\u5831\u5C3A\u5BF8",
  "Presentation 16:9": "\u6F14\u793A 16:9",
  "Presentation 9:16": "\u6F14\u793A 9:16",
  "A4 Vertical": "A4 \u7E31\u5411",
  "A4 Horizontal": "A4 \u6A6B\u5411",
  "User TOC Page List Class": "\u4F7F\u7528\u8005\u81EA\u5EFA\u76EE\u9304\u9801\u5217\u8868\u6A23\u5F0F",
  "User Chapter Page List Class": "\u4F7F\u7528\u8005\u81EA\u5EFA\u7AE0\u7BC0\u9801\u5217\u8868\u6A23\u5F0F",
  "User Content Page List Class": "\u4F7F\u7528\u8005\u81EA\u5EFA\u5167\u5BB9\u9801\u5217\u8868\u6A23\u5F0F",
  "User Blank Page List Class": "\u4F7F\u7528\u8005\u81EA\u5EFA\u7A7A\u767D\u9801\u5217\u8868\u6A23\u5F0F",
  "User BackCover Page List Class": "\u4F7F\u7528\u8005\u81EA\u5EFA\u5C01\u5E95\u9801\u5217\u8868\u6A23\u5F0F",
  "Set User TOC Page List Class": "\u8A2D\u5B9A\u4F7F\u7528\u8005\u81EA\u5EFA\u76EE\u9304\u9801\u5217\u8868\u6A23\u5F0F",
  "Set User Chapter Page List Class": "\u8A2D\u5B9A\u4F7F\u7528\u8005\u81EA\u5EFA\u7AE0\u7BC0\u9801\u5217\u8868\u6A23\u5F0F",
  "Set User Content Page List Class": "\u8A2D\u5B9A\u4F7F\u7528\u8005\u81EA\u5EFA\u5167\u5BB9\u9801\u5217\u8868\u6A23\u5F0F",
  "Set User Blank Page List Class": "\u8A2D\u5B9A\u4F7F\u7528\u8005\u81EA\u5EFA\u7A7A\u767D\u9801\u5217\u8868\u6A23\u5F0F",
  "Set User BackCover Page List Class": "\u8A2D\u5B9A\u4F7F\u7528\u8005\u81EA\u5EFA\u5C01\u5E95\u9801\u5217\u8868\u6A23\u5F0F",
  "This Action is only available for Paid Users": "\u6B64\u529F\u80FD\u50C5\u4F9B\u4ED8\u8CBB\u7528\u6236\u4F7F\u7528",
  "Content Page Slide Type": "\u5167\u5BB9\u9801\u5E7B\u71C8\u7247\u985E\u578B",
  "Please select the default slide type for content pages": "\u8ACB\u9078\u64C7\u5167\u5BB9\u9801\u7684\u9810\u8A2D\u5E7B\u71C8\u7247\u985E\u578B",
  Horizontal: "\u6C34\u5E73",
  Vertical: "\u5782\u76F4",
  "Slide Navigation Mode": "\u5E7B\u71C8\u7247\u5C0E\u822A\u6A21\u5F0F",
  "Please select the default slide navigation mode": "\u8ACB\u9078\u64C7\u5167\u5BB9\u9801\u7684\u9810\u8A2D\u5E7B\u71C8\u7247\u5C0E\u822A\u6A21\u5F0F",
  Default: "\u9ED8\u8A8D",
  Linear: "\u7DDA\u6027",
  Grid: "\u7DB2\u683C",
  "Default TOC Page Position": "\u9810\u8A2D\u76EE\u9304\u9801\u4F4D\u7F6E",
  "Set Default TOC Page Position": "\u8A2D\u5B9A\u9810\u8A2D\u76EE\u9304\u9801\u4F4D\u7F6E",
  "Convert to Marp Slides": "\u5C07\u7576\u524D\u7B46\u8A18\u8F49\u63DB\u70BA Marp \u5E7B\u71C8\u7247",
  "User Specific Frontmatter Options": "\u7528\u6236\u81EA\u5B9A\u7FA9 Frontmatter \u9078\u9805",
  "User Customized CSS": "\u7528\u6236\u81EA\u5B9A\u7FA9 CSS",
  "Input Your Customized CSS": "\u8F38\u5165\u60A8\u7684\u81EA\u5B9A\u7FA9 CSS",
  "Frontmatter Options": "Frontmatter \u9078\u9805",
  "Input Your Frontmatter Options": "\u8F38\u5165\u60A8\u7684 Frontmatter \u9078\u9805",
  "Advanced Slides YAML Reference": "Advanced Slides YAML \u53C3\u8003",
  "Get The Latest Version Of Marp Themes": "\u7372\u53D6\u6700\u65B0\u7684 Marp \u4E3B\u984C",
  "Marp Themes updated.": "Marp \u4E3B\u984C\u5DF2\u66F4\u65B0\u3002",
  "Add Default Marp Themes for VS Code": "\u70BA VS Code \u6DFB\u52A0\u9ED8\u8A8D Marp \u4E3B\u984C",
  "User Customized Marp CSS": "\u7528\u6236\u81EA\u5B9A\u7FA9 Marp CSS",
  "Input Your Customized Marp CSS": "\u8F38\u5165\u60A8\u7684\u81EA\u5B9A\u7FA9 Marp CSS",
  "Toggle TOC Page Fragments": "\u5207\u63DB\u76EE\u9304\u9801\u7247\u6BB5",
  "Toggle Chapter Page Fragments": "\u5207\u63DB\u7AE0\u7BC0\u9801\u7247\u6BB5",
  "Turn on to use fragments": "\u958B\u555F\u4EE5\u4F7F\u7528\u7247\u6BB5",
  "List Class Name Added by User": "\u7528\u6236\u6DFB\u52A0\u7684\u5217\u8868\u985E\u540D",
  "Columns Class Name Added by User": "\u7528\u6236\u6DFB\u52A0\u7684\u5217\u985E\u540D",
  "One Class name each line": "\u6BCF\u884C\u4E00\u500B\u985E\u540D",
  WithoutNav: "\u7121\u5C0E\u822A",
  "Turn on Base Layout Nav": "\u958B\u555F\u5C0E\u822A\u5E03\u5C40",
  "Turn on to use base layout with nav": "\u958B\u555F\u4EE5\u4F7F\u7528\u5C0E\u822A\u5E03\u5C40",
  SLIDESRUP_SLOGAN: "\u7C21\u55AE\u3001\u512A\u96C5\u4E14\u5F37\u5927",
  "Separate Nav and TOC": "\u5206\u96E2\u5C0E\u822A\u548C\u76EE\u9304",
  "Turn on to separate nav and TOC": "\u958B\u555F\u4EE5\u5206\u96E2\u5C0E\u822A\u548C\u76EE\u9304",
  Nav: "\u5C0E\u822A",
  "Toggle Chapter and Content Page Heading OBURI": "\u5207\u63DB\u7AE0\u7BC0\u9801\u548C\u5167\u5BB9\u9801\u6A19\u984C OBURI",
  "Turn on to enable Heading OBURI for chapter and content pages": "\u958B\u555F\u4EE5\u555F\u7528\u7AE0\u7BC0\u9801\u548C\u5167\u5BB9\u9801\u6A19\u984C OBURI",
  "commentController.appendClass": "\u8FFD\u52A0\u985E",
  "commentController.replaceClass": "\u66FF\u63DB\u985E",
  "commentController.anchorHeading": "\u9396\u5B9A\u6A19\u984C",
  "commentController.addNotes": "\u6DFB\u52A0\u8A3B\u91CB",
  "commentController.replaceTemplate": "\u66FF\u63DB\u6A21\u677F",
  "commentController.hideSlide": "\u96B1\u85CF\u5E7B\u71C8\u7247",
  "commentController.addHeadingAliases": "\u6DFB\u52A0\u6A19\u984C\u5225\u540D",
  "commentController.addPageSeparator": "\u6DFB\u52A0\u9801\u9762\u5206\u9694\u7B26",
  "commentController.resetCounter": "\u91CD\u7F6E\u8A08\u6578\u5668",
  "commentController.useNoNavTemplate": "\u4F7F\u7528\u7121\u5C0E\u822A\u6A21\u677F",
  "commentController.addSlideBackground": "\u6DFB\u52A0\u5E7B\u71C8\u7247\u80CC\u666F",
  "blockController.block": "\u666E\u901ABlock",
  "blockController.leftBlock": "\u5DE6\u5C0D\u9F4ABlock",
  "blockController.centerBlock": "\u5C45\u4E2D\u5C0D\u9F4ABlock",
  "blockController.rightBlock": "\u53F3\u5C0D\u9F4ABlock",
  "Get The Latest Version Of Help Docs": "\u7372\u53D6\u6700\u65B0\u7684\u5E6B\u52A9\u6587\u4EF6",
  "Help docs updated.": "\u5E6B\u52A9\u6587\u4EF6\u5DF2\u66F4\u65B0\u3002",
  WithoutComments: "\u7121\u8A3B\u91CB",
  NoteCreated: "\u7B46\u8A18\u5DF2\u5EFA\u7ACB\uFF1A",
  NoteUpdated: "\u7B46\u8A18\u5DF2\u66F4\u65B0\uFF1A",
  FailedToCreateOrUpdateNote: "\u5EFA\u7ACB\u6216\u66F4\u65B0\u7B46\u8A18\u5931\u6557\uFF1A",
  MakeCopyWithoutComments: "\u5EFA\u7ACB\u6216\u66F4\u65B0\u7576\u524D\u6A94\u6848\u7684\u7121\u8A3B\u91CB\u526F\u672C",
  "Help documents updated today": "\u4ECA\u5929\u66F4\u65B0\u7684\u5E6B\u52A9\u6587\u4EF6",
  "Help documents updated in the past week": "\u6700\u8FD1\u4E00\u5468\u66F4\u65B0\u7684\u5E6B\u52A9\u6587\u4EF6",
  "Help documents updated in the past two weeks": "\u6700\u8FD1\u4E24\u5468\u66F4\u65B0\u7684\u5E6B\u52A9\u6587\u4EF6",
  "Help documents updated in the past month": "\u6700\u8FD1\u4E00\u500B\u6708\u66F4\u65B0\u7684\u5E6B\u52A9\u6587\u4EF6",
  "All help documents": "\u6240\u6709\u5E6B\u52A9\u6587\u4EF6",
  "Update User Permissions": "\u66F4\u65B0\u7528\u6236\u6B0A\u9650",
  "Update User Permissions Success": "\u66F4\u65B0\u7528\u6236\u6B0A\u9650\u6210\u529F",
  "Update User Permissions Failed": "\u66F4\u65B0\u7528\u6236\u6B0A\u9650\u5931\u6557",
  "Updating User Permissions ...": "\u6B63\u5728\u66F4\u65B0\u7528\u6236\u6B0A\u9650 ...",
  "Slides Saving Location": "\u5E7B\u71C8\u7247\u5132\u5B58\u4F4D\u7F6E",
  "Slides Basic Settings": "\u5E7B\u71C8\u7247\u57FA\u672C\u8A2D\u5B9A",
  "Invalid GitHub repository URL": "\u7121\u6548\u7684 GitHub \u5009\u5EAB\u9023\u7D50",
  "Invalid Gitee repository URL": "\u7121\u6548\u7684 Gitee \u5009\u5EAB\u9023\u7D50",
  "Checking for updates from": "\u6B63\u5728\u6AA2\u67E5\u66F4\u65B0\uFF1A",
  "No release found for this repository": "\u672A\u627E\u5230\u6B64\u5009\u5EAB\u7684\u767C\u5E03\u7248\u672C",
  "Release is missing manifest.json or main.js. Cannot install.": "\u767C\u5E03\u7248\u672C\u7F3A\u5C11 manifest.json \u6216 main.js\uFF0C\u7121\u6CD5\u5B89\u88DD\u3002",
  "Invalid manifest.json: missing 'id' field": "\u7121\u6548\u7684 manifest.json\uFF1A\u7F3A\u5C11 'id' \u6B04\u4F4D",
  Plugin: "\u63D2\u4EF6",
  "installed/updated successfully": "\u5B89\u88DD/\u66F4\u65B0\u6210\u529F",
  reloaded: "\u5DF2\u91CD\u65B0\u8F09\u5165",
  "Automatic reload failed": "\u81EA\u52D5\u91CD\u8F09\u5931\u6557",
  "Plugin updated but reload failed": "\u63D2\u4EF6\u5DF2\u66F4\u65B0\uFF0C\u4F46\u81EA\u52D5\u91CD\u8F09\u5931\u6557\uFF0C\u8ACB\u624B\u52D5\u91CD\u555F Obsidian \u6216\u91CD\u65B0\u555F\u7528\u63D2\u4EF6\u3002",
  "Plugin installed, please enable manually": "\u63D2\u4EF6\u5B89\u88DD\u5B8C\u6210\uFF0C\u8ACB\u5728\u8A2D\u5B9A\u4E2D\u624B\u52D5\u555F\u7528\u3002",
  "Failed to install plugin": "\u5B89\u88DD\u63D2\u4EF6\u5931\u6557",
  "Check console for details": "\u8ACB\u67E5\u770B\u63A7\u5236\u53F0\u4E86\u89E3\u8A73\u60C5",
  "is already up to date": "\u5DF2\u7D93\u662F\u6700\u65B0\u7248",
  "Current Version": "\u76EE\u524D\u7248\u672C",
  "Check for Updates": "\u6AA2\u67E5\u66F4\u65B0",
  "Checking...": "\u6B63\u5728\u6AA2\u67E5...",
  "Already up to date": "\u5DF2\u7D93\u662F\u6700\u65B0\u7248\u672C",
  "Update available": "\u6709\u53EF\u7528\u66F4\u65B0",
  "Start Update": "\u958B\u59CB\u66F4\u65B0",
  "You are using a development version": "\u60A8\u6B63\u5728\u4F7F\u7528\u958B\u767C\u7248\u672C",
  "Failed to check for updates": "\u6AA2\u67E5\u66F4\u65B0\u5931\u6557",
  "Updating...": "\u6B63\u5728\u66F4\u65B0...",
  Updated: "\u66F4\u65B0\u5B8C\u6210",
  "Restart Obsidian to apply changes": "\u91CD\u555F Obsidian \u4EE5\u61C9\u7528\u66F4\u6539",
  "Install IOTO Dashboard": "\u5B89\u88DDIOTO\u5100\u8868\u677F",
  "Downloading manifest": "\u6B63\u5728\u4E0B\u8F09\u6E05\u55AE\u6A94\u6848...",
  "Downloading plugin files": "\u6B63\u5728\u4E0B\u8F09\u63D2\u4EF6\u6A94\u6848...",
  PluginIndicator: " (\u63D2\u4EF6)",
  API_Token_Invalid: "API\u91D1\u9470\u7121\u6548",
  "Plugin Download Source": "\u63D2\u4EF6\u4E0B\u8F09\u4F86\u6E90",
  "Choose where to download and update plugins": "\u9078\u64C7\u63D2\u4EF6\u4E0B\u8F09\u8207\u66F4\u65B0\u4F86\u6E90",
  GitHub: "GitHub",
  Gitee: "Gitee",
  "Open Design Maker": "\u6253\u958B Design Maker",
  "Design Maker": "Design Maker",
  "Enable Design Maker": "\u555F\u7528 Design Maker",
  "Enable the visual Design Maker workspace": "\u555F\u7528\u8996\u89BA\u5316 Design Maker \u5DE5\u4F5C\u5340",
  "Default Design Maker Base Design": "Design Maker \u9810\u8A2D\u57FA\u790E\u8A2D\u8A08",
  "Please select the default design used by Design Maker": "\u8ACB\u9078\u64C7 Design Maker \u9810\u8A2D\u4F7F\u7528\u7684\u57FA\u790E\u8A2D\u8A08",
  "Show Design Maker Advanced Source Editor": "\u986F\u793A Design Maker \u9032\u968E\u539F\u59CB\u78BC\u7DE8\u8F2F\u5668",
  "Show the fallback source editor in Design Maker": "\u5728 Design Maker \u4E2D\u986F\u793A\u539F\u59CB\u78BC\u5099\u63F4\u7DE8\u8F2F\u5668",
  "Auto sync VS Code theme after saving": "\u5132\u5B58\u5F8C\u81EA\u52D5\u540C\u6B65 VS Code \u4E3B\u984C",
  "Sync the Marp theme to VS Code after Design Maker saves": "Design Maker \u5132\u5B58\u5F8C\u540C\u6B65 Marp \u4E3B\u984C\u5230 VS Code",
  "Design Maker Preview Scale": "Design Maker \u9810\u89BD\u7E2E\u653E",
  "Adjust the preview scale in Design Maker": "\u8ABF\u6574 Design Maker \u4E2D\u7684\u9810\u89BD\u7E2E\u653E",
  "Design Maker Slide Base Width": "Design Maker \u908F\u8F2F\u57FA\u6E96\u5BEC\u5EA6",
  "Set the logical slide width used by Design Maker rendering": "\u8A2D\u5B9A Design Maker \u6E32\u67D3\u4F7F\u7528\u7684\u908F\u8F2F\u6295\u5F71\u7247\u5BEC\u5EA6",
  "Design Maker Slide Base Height": "Design Maker \u908F\u8F2F\u57FA\u6E96\u9AD8\u5EA6",
  "Set the logical slide height used by Design Maker rendering": "\u8A2D\u5B9A Design Maker \u6E32\u67D3\u4F7F\u7528\u7684\u908F\u8F2F\u6295\u5F71\u7247\u9AD8\u5EA6",
  "Design Maker saved": "Design Maker \u5DF2\u5132\u5B58",
  "Design already exists": "\u8A2D\u8A08\u5DF2\u5B58\u5728",
  "Save and Apply": "\u5132\u5B58\u4E26\u5957\u7528",
  "Reload Design": "\u91CD\u65B0\u8F09\u5165\u8A2D\u8A08",
  "Design Pages": "\u8A2D\u8A08\u9801\u9762",
  "Load Design": "\u532F\u5165\u8A2D\u8A08",
  "Contains source only blocks": "\u5305\u542B\u50C5\u652F\u63F4\u539F\u59CB\u78BC\u7DE8\u8F2F\u7684\u5340\u584A",
  "Show Block": "\u986F\u793A\u5340\u584A",
  "Hide Block": "\u96B1\u85CF\u5340\u584A",
  "Design Theme": "\u8A2D\u8A08\u4E3B\u984C",
  "Primary Color": "\u4E3B\u8272",
  "Secondary Color": "\u8F14\u52A9\u8272",
  "Background Color": "\u80CC\u666F\u8272",
  "Text Color": "\u6587\u5B57\u8272",
  "Body Font": "\u6B63\u6587\u5B57\u9AD4",
  "Heading Scale": "\u6A19\u984C\u7E2E\u653E",
  "Body Scale": "\u6B63\u6587\u7E2E\u653E",
  "Border Radius": "\u5713\u89D2",
  "Shadow Opacity": "\u9670\u5F71\u900F\u660E\u5EA6",
  "Theme Mode": "\u4E3B\u984C\u6A21\u5F0F",
  "Live Preview": "\u5373\u6642\u9810\u89BD",
  "Block Inspector": "\u5340\u584A\u5C6C\u6027",
  "Select a block": "\u8ACB\u9078\u64C7\u4E00\u500B\u5340\u584A",
  "This block is source only": "\u6B64\u5340\u584A\u50C5\u652F\u63F4\u539F\u59CB\u78BC\u7DE8\u8F2F",
  "Block Content": "\u5340\u584A\u5167\u5BB9",
  "CSS Class": "CSS \u985E\u540D",
  "Inline Style": "\u5167\u806F\u6A23\u5F0F",
  "Page Source": "\u9801\u9762\u539F\u59CB\u78BC",
  "Apply Source Changes": "\u5957\u7528\u539F\u59CB\u78BC\u4FEE\u6539",
  "Theme CSS": "\u4E3B\u984C CSS",
  "Apply Theme CSS": "\u5957\u7528\u4E3B\u984C CSS",
  "Theme CSS updated": "\u4E3B\u984C CSS \u5DF2\u66F4\u65B0",
  "No design loaded": "\u76EE\u524D\u6C92\u6709\u8F09\u5165\u8A2D\u8A08",
  "Loading design": "\u6B63\u5728\u8F09\u5165\u8A2D\u8A08...",
  "Failed to load design": "\u8F09\u5165\u8A2D\u8A08\u5931\u6557\uFF1A",
  "Add Grid": "\u65B0\u589E\u7DB2\u683C",
  "Add Text": "\u65B0\u589E\u6587\u5B57",
  "Add Image": "\u65B0\u589E\u5716\u7247",
  "Add Placeholder": "\u65B0\u589E\u4F54\u4F4D\u7B26",
  "Add Content Slot": "\u65B0\u589E\u5167\u5BB9\u69FD\u4F4D",
  "Duplicate Block": "\u8907\u88FD\u5340\u584A",
  "Delete Block": "\u522A\u9664\u5340\u584A",
  "Add Footnotes": "\u65B0\u589E Footnotes",
  "Add SR-SideBar": "\u65B0\u589E SR-SideBar",
  "Empty Block": "\u7A7A\u5340\u584A",
  "Create New Design In Design Maker": "\u5728 Design Maker \u4E2D\u65B0\u5EFA\u8A2D\u8A08",
  "Load Existing Design In Design Maker": "\u5728 Design Maker \u4E2D\u8F09\u5165\u73FE\u6709\u8A2D\u8A08",
  "No existing user designs found": "\u6C92\u6709\u627E\u5230\u53EF\u8F09\u5165\u7684\u7528\u6236\u8A2D\u8A08",
  "Footnotes block already exists": "Footnotes \u5340\u584A\u5DF2\u5B58\u5728",
  "SR-SideBar block already exists": "SR-SideBar \u5340\u584A\u5DF2\u5B58\u5728",
  Design: "\u8A2D\u8A08",
  Preview: "\u9810\u89BD",
  "Placeholder Category Layout": "\u4F48\u5C40",
  "Placeholder Category Navigation": "\u5C0E\u822A",
  "Placeholder Category Metadata": "\u5143\u8CC7\u8A0A",
  "Placeholder Category Branding": "\u54C1\u724C",
  "Placeholder Category Variable": "\u8B8A\u91CF",
  X: "X",
  Y: "Y",
  Width: "\u5BEC\u5EA6",
  Height: "\u9AD8\u5EA6",
  Padding: "\u5167\u908A\u8DDD",
  Flow: "\u6D41\u5F0F\u4F48\u5C40",
  "Justify Content": "\u5167\u5BB9\u5C0D\u9F4A",
  Background: "\u80CC\u666F",
  Border: "\u908A\u6846",
  Animation: "\u52D5\u756B",
  Opacity: "\u900F\u660E\u5EA6",
  Rotate: "\u65CB\u8F49",
  Fragment: "\u52D5\u756B\u9806\u4F4D (Frag)",
  Column: "\u5782\u76F4 (Col)",
  Row: "\u6C34\u5E73 (Row)",
  Left: "\u5DE6\u5C0D\u9F4A",
  Right: "\u53F3\u5C0D\u9F4A",
  Center: "\u7F6E\u4E2D",
  Justify: "\u5DE6\u53F3\u5C0D\u9F4A",
  Block: "\u5340\u584A",
  Top: "\u9802\u90E8",
  Bottom: "\u5E95\u90E8",
  "Top Left": "\u5DE6\u4E0A",
  "Top Right": "\u53F3\u4E0A",
  "Bottom Left": "\u5DE6\u4E0B",
  "Bottom Right": "\u53F3\u4E0B",
  Stretch: "\u62C9\u4F38",
  Start: "\u8D77\u59CB",
  End: "\u7D50\u675F",
  "Space Between": "\u5169\u7AEF\u7A7A\u767D",
  "Space Around": "\u74B0\u7E5E\u7A7A\u767D",
  "Space Evenly": "\u5747\u52FB\u7A7A\u767D",
  "Fade In": "\u6DE1\u5165",
  "Fade Out": "\u6DE1\u51FA",
  "Slide Right In": "\u5411\u53F3\u6ED1\u5165",
  "Slide Left In": "\u5411\u5DE6\u6ED1\u5165",
  "Slide Up In": "\u5411\u4E0A\u6ED1\u5165",
  "Slide Down In": "\u5411\u4E0B\u6ED1\u5165",
  "Slide Right Out": "\u5411\u53F3\u6ED1\u51FA",
  "Slide Left Out": "\u5411\u5DE6\u6ED1\u51FA",
  "Slide Up Out": "\u5411\u4E0A\u6ED1\u51FA",
  "Slide Down Out": "\u5411\u4E0B\u6ED1\u51FA",
  "Scale Up": "\u653E\u5927",
  "Scale Up Out": "\u653E\u5927\u4E26\u9000\u51FA",
  "Scale Down": "\u7E2E\u5C0F",
  "Scale Down Out": "\u7E2E\u5C0F\u4E26\u9000\u51FA",
  Slower: "\u66F4\u6162",
  Faster: "\u66F4\u5FEB",
  Filter: "\u6FFE\u93E1",
  Align: "\u5C0D\u9F4A"
};

// src/lang/helpers.ts
var localeMap = {
  en: en_default,
  "zh-cn": zh_cn_default,
  "zh-tw": zh_tw_default
};
var cachedLocale = null;
var cachedLang = null;
function _get_current_lang() {
  var _a, _b, _c;
  try {
    const app = getAppInstance();
    const slidesRupRunningLanguage = (_c = (_b = (_a = app.plugins.plugins["slides-rup"]) == null ? void 0 : _a.settings) == null ? void 0 : _b.slidesRupRunningLanguage) != null ? _c : "ob";
    return slidesRupRunningLanguage === "ob" ? import_obsidian2.moment.locale() : slidesRupRunningLanguage;
  } catch (e) {
    console.error(
      "Failed to get language setting, falling back to 'en'",
      e
    );
    return "en";
  }
}
function _get_locale() {
  const lang = _get_current_lang();
  if (cachedLocale && cachedLang === lang) {
    return cachedLocale;
  }
  const baseLocale = en_default;
  const specificLocale = localeMap[lang];
  const locale = specificLocale && specificLocale !== baseLocale ? __spreadValues(__spreadValues({}, baseLocale), specificLocale) : baseLocale;
  cachedLocale = locale;
  cachedLang = lang;
  return locale;
}
function t(str) {
  return _get_locale()[str];
}

// src/services/design-maker-schema.ts
var DESIGN_PAGE_DEFINITIONS = [
  {
    type: "cover",
    labelKey: "Cover",
    getFileName: (designName) => `${t("Cover")}-${designName}.md`
  },
  {
    type: "toc",
    labelKey: "TOC",
    getFileName: (designName) => `${t("TOC")}-${designName}.md`
  },
  {
    type: "chapter",
    labelKey: "Chapter",
    getFileName: (designName) => `${t("Chapter")}-${designName}.md`
  },
  {
    type: "content",
    labelKey: "ContentPage",
    getFileName: (designName) => `${t("ContentPage")}-${designName}.md`
  },
  {
    type: "contentWithoutNav",
    labelKey: "ContentPage",
    getFileName: (designName) => `${t("ContentPage")}-${t("WithoutNav")}-${designName}.md`
  },
  {
    type: "blank",
    labelKey: "BlankPage",
    getFileName: (designName) => `${t("BlankPage")}-${designName}.md`
  },
  {
    type: "backCover",
    labelKey: "BackCover",
    getFileName: (designName) => `${t("BackCover")}-${designName}.md`
  }
];
function getDesignPageDefinition(type) {
  return DESIGN_PAGE_DEFINITIONS.find((item) => item.type === type);
}
function getDesignPageDisplayName(fileName) {
  const normalizedFileName = fileName.replace(/\.[^/.]+$/, "");
  const lastHyphenIndex = normalizedFileName.lastIndexOf("-");
  if (lastHyphenIndex === -1) {
    return normalizedFileName;
  }
  return normalizedFileName.slice(0, lastHyphenIndex);
}
function getDesignPageFileName(type, designName) {
  var _a;
  return ((_a = getDesignPageDefinition(type)) == null ? void 0 : _a.getFileName(designName)) || "";
}

// src/services/design-maker-parser.ts
var blockSeed = 0;
function nextBlockId(prefix) {
  blockSeed += 1;
  return `${prefix}-${blockSeed}`;
}
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function clampInt(value, min, max) {
  return Math.round(clamp(value, min, max));
}
function detectExplicitRectUnit(value) {
  const parts = (value || "").trim().split(/\s+/).filter(Boolean);
  for (const part of parts) {
    const match = part.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
    if (!match)
      continue;
    const unit = (match[2] || "").toLowerCase();
    if (unit === "px")
      return "px";
    if (unit === "%" || unit === "percent")
      return "percent";
  }
  return null;
}
function normalizeCoordinateString(value) {
  if (!value)
    return value;
  const parts = value.trim().split(/\s+/);
  return parts.map((part) => {
    if (/^-?\d+(?:\.\d+)?$/.test(part)) {
      return `${part}px`;
    }
    return part;
  }).join(" ");
}
function formatRectInputValue(value, rectUnit) {
  const rounded = Math.round(value);
  return rectUnit === "px" ? `${rounded}px` : `${rounded}`;
}
function parseRectInputValue(raw, defaultUnitForUnitless = "percent") {
  const trimmed = raw.trim();
  if (!trimmed)
    return null;
  if (trimmed.toLowerCase().endsWith("px")) {
    const num2 = Number(trimmed.slice(0, -2).trim());
    if (!Number.isFinite(num2))
      return null;
    return { value: num2, rectUnit: "px" };
  }
  if (trimmed.endsWith("%")) {
    const num2 = Number(trimmed.slice(0, -1).trim());
    if (!Number.isFinite(num2))
      return null;
    return { value: num2, rectUnit: "percent" };
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num))
    return null;
  return { value: num, rectUnit: defaultUnitForUnitless };
}
function parsePair(value, fallbackA, fallbackB, rectUnit, warnings) {
  if (!value)
    return [fallbackA, fallbackB];
  const trimmed = value.trim();
  if (rectUnit !== "px") {
    if (trimmed === "topleft")
      return [0, 0];
    if (trimmed === "topright")
      return [50, 0];
    if (trimmed === "bottomleft")
      return [0, 50];
    if (trimmed === "bottomright")
      return [50, 50];
  } else if ([
    "topleft",
    "topright",
    "bottomleft",
    "bottomright",
    "center",
    "top",
    "bottom",
    "left",
    "right"
  ].includes(trimmed)) {
    warnings.push(
      `Detected keyword positioning "${trimmed}" in px mode; falling back to defaults.`
    );
    return [fallbackA, fallbackB];
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    const a = parseNumericToken(parts[0], rectUnit, "x", warnings);
    const b = parseNumericToken(parts[1], rectUnit, "y", warnings);
    if (a != null && b != null)
      return [a, b];
  }
  return [fallbackA, fallbackB];
}
var DEFAULT_DESIGN_BASE_WIDTH = 1920;
var DEFAULT_DESIGN_BASE_HEIGHT = 1080;
function parseNumericToken(token, rectUnit, dimension, warnings) {
  const match = token.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
  if (!match)
    return null;
  const value = Number(match[1]);
  if (!Number.isFinite(value))
    return null;
  const unit = (match[2] || "").toLowerCase();
  const isPx = unit === "px";
  const isPercent = unit === "%" || unit === "";
  if (rectUnit === "px") {
    if (isPercent) {
      const base = dimension === "x" ? DEFAULT_DESIGN_BASE_WIDTH : DEFAULT_DESIGN_BASE_HEIGHT;
      return Math.round(value / 100 * base);
    }
    if (!isPx) {
      warnings.push(
        `Detected unsupported unit "${unit}" in px mode; treating it as px.`
      );
    }
    return Math.round(value);
  } else {
    if (isPx) {
      const base = dimension === "x" ? DEFAULT_DESIGN_BASE_WIDTH : DEFAULT_DESIGN_BASE_HEIGHT;
      return Math.round(value / base * 100);
    }
    if (unit && unit !== "%") {
      warnings.push(
        `Detected unsupported unit "${unit}" in percent mode; stripping unit and treating it as a number.`
      );
    }
    return Math.round(value);
  }
}
function detectDefaultRectUnit(markdown) {
  const warnings = [];
  const unitsSeen = /* @__PURE__ */ new Set();
  let hasBareNumber = false;
  const attrRegex = /\b(?:drag|drop)\s*=\s*"([^"]*)"/g;
  let match = attrRegex.exec(markdown);
  while (match) {
    const value = match[1] || "";
    const parts = value.trim().split(/\s+/).filter(Boolean);
    for (const part of parts) {
      const m = part.trim().match(/^(-?\d+(?:\.\d+)?)([a-z%]+)?$/i);
      if (!m)
        continue;
      const unit = (m[2] || "").toLowerCase();
      if (!unit)
        hasBareNumber = true;
      else
        unitsSeen.add(unit);
    }
    match = attrRegex.exec(markdown);
  }
  const rectUnit = unitsSeen.has("px") && !hasBareNumber ? "px" : "percent";
  const unsupportedUnits = Array.from(unitsSeen).filter(
    (u) => u !== "px" && u !== "%"
  );
  if (unsupportedUnits.length > 0) {
    warnings.push(
      `Detected unsupported units in template: ${unsupportedUnits.join(
        ", "
      )}. They will be auto-corrected.`
    );
  }
  return { rectUnit, warnings };
}
function parseAttributes(raw) {
  const attrs = {};
  const attrRegex = /([:\w-]+)="([^"]*)"/g;
  let match = attrRegex.exec(raw);
  while (match) {
    attrs[match[1]] = match[2];
    match = attrRegex.exec(raw);
  }
  return attrs;
}
function parseGridSegments(source) {
  const segments = [];
  const topLevelRanges = [];
  const stack = [];
  const tokenRegex = /<grid\b([^>]*)>|<\/grid>/g;
  let match = tokenRegex.exec(source);
  while (match) {
    const token = match[0];
    if (token.startsWith("<grid")) {
      stack.push({
        attrSource: match[1] || "",
        start: match.index,
        openEnd: tokenRegex.lastIndex
      });
    } else {
      const opening = stack.pop();
      if (!opening) {
        match = tokenRegex.exec(source);
        continue;
      }
      const segment = {
        attrSource: opening.attrSource,
        content: source.slice(opening.openEnd, match.index),
        start: opening.start,
        end: tokenRegex.lastIndex
      };
      segments.push(segment);
      if (stack.length === 0) {
        topLevelRanges.push({
          start: opening.start,
          end: tokenRegex.lastIndex
        });
      }
    }
    match = tokenRegex.exec(source);
  }
  segments.sort((a, b) => a.start - b.start);
  topLevelRanges.sort((a, b) => a.start - b.start);
  return {
    segments,
    topLevelRanges
  };
}
function stripNestedGridMarkup(content) {
  const { topLevelRanges } = parseGridSegments(content);
  if (topLevelRanges.length === 0) {
    return content.trim();
  }
  let cursor = 0;
  let result = "";
  topLevelRanges.forEach((range) => {
    result += content.slice(cursor, range.start);
    cursor = range.end;
  });
  result += content.slice(cursor);
  return result.trim();
}
function inferRole(content) {
  const trimmed = content.trim();
  if (trimmed.includes("<% content %>"))
    return "content";
  if (trimmed.startsWith("!["))
    return "image";
  if (trimmed.includes("{{"))
    return "placeholder";
  if (!trimmed)
    return "grid";
  return "text";
}
function createRawBlock(raw) {
  if (!raw.trim())
    return null;
  return {
    id: nextBlockId("raw"),
    type: "raw",
    raw: raw.trim()
  };
}
function createFootnotesBlock(rectUnit) {
  const rect = rectUnit === "px" ? {
    x: 0,
    y: Math.round(DEFAULT_DESIGN_BASE_HEIGHT * 92 / 100),
    width: DEFAULT_DESIGN_BASE_WIDTH,
    height: Math.round(DEFAULT_DESIGN_BASE_HEIGHT * 8 / 100)
  } : { x: 0, y: 92, width: 100, height: 8 };
  return {
    id: nextBlockId("grid"),
    type: "grid",
    role: "placeholder",
    rect,
    content: "<%? footnotes %>",
    className: "footnotes",
    style: "",
    pad: "0 40px",
    align: "topleft",
    flow: "",
    filter: "",
    justifyContent: "",
    bg: "",
    border: "",
    animate: "",
    opacity: "",
    rotate: "",
    frag: "",
    extraAttributes: {}
  };
}
function createSideBarBlock(rectUnit) {
  const rect = rectUnit === "px" ? {
    x: Math.round(DEFAULT_DESIGN_BASE_WIDTH * 95 / 100),
    y: Math.round(DEFAULT_DESIGN_BASE_HEIGHT * 35 / 100),
    width: Math.round(DEFAULT_DESIGN_BASE_WIDTH * 5 / 100),
    height: Math.round(DEFAULT_DESIGN_BASE_HEIGHT * 30 / 100)
  } : { x: 95, y: 35, width: 5, height: 30 };
  return {
    id: nextBlockId("grid"),
    type: "grid",
    role: "placeholder",
    rect,
    content: "![[SR-SideBar]]",
    className: "sr-sidebar",
    style: "",
    pad: "0",
    align: "topleft",
    flow: "",
    filter: "",
    justifyContent: "",
    bg: "",
    border: "",
    animate: "",
    opacity: "",
    rotate: "",
    frag: "",
    extraAttributes: {}
  };
}
function appendRawBlocksAndFootnotes(raw, blocks, state, rectUnit, warnings) {
  const normalizedRaw = raw.trim();
  if (!normalizedRaw)
    return;
  const specialRegex = /<%\?\s*footnotes\s*%>|!\[\[\s*SR-SideBar(?:\|[^\]]+)?\s*\]\]/g;
  if (!specialRegex.test(normalizedRaw)) {
    const rawBlock = createRawBlock(raw);
    if (rawBlock)
      blocks.push(rawBlock);
    return;
  }
  specialRegex.lastIndex = 0;
  let lastIndex = 0;
  let match = specialRegex.exec(normalizedRaw);
  while (match) {
    const segment = normalizedRaw.slice(lastIndex, match.index);
    const rawBlock = createRawBlock(segment);
    if (rawBlock)
      blocks.push(rawBlock);
    const token = match[0];
    if (token.includes("footnotes")) {
      if (!state.hasFootnotesBlock) {
        blocks.push(createFootnotesBlock(rectUnit));
        state.hasFootnotesBlock = true;
      }
    } else if (!state.hasSideBarBlock) {
      blocks.push(createSideBarBlock(rectUnit));
      state.hasSideBarBlock = true;
    }
    lastIndex = match.index + token.length;
    match = specialRegex.exec(normalizedRaw);
  }
  const tail = createRawBlock(normalizedRaw.slice(lastIndex));
  if (tail)
    blocks.push(tail);
}
function createGridBlock(attrSource, content, inheritedRectUnit, warnings) {
  const attrs = parseAttributes(attrSource);
  const explicitUnit = detectExplicitRectUnit(attrs.drag || "") || detectExplicitRectUnit(attrs.drop || "");
  const rectUnit = explicitUnit != null ? explicitUnit : inheritedRectUnit;
  const [width, height] = parsePair(
    attrs.drag || "",
    100,
    30,
    rectUnit,
    warnings
  );
  const normalizedDrop = rectUnit === "px" ? normalizeCoordinateString(attrs.drop || "") : attrs.drop || "";
  const [x, y] = parsePair(normalizedDrop, 0, 0, rectUnit, warnings);
  const cleanedContent = stripNestedGridMarkup(content);
  const rawChildren = parseGridBlocks(
    content,
    {
      hasFootnotesBlock: true,
      hasSideBarBlock: true
    },
    rectUnit,
    warnings
  );
  const children = rawChildren.filter((c) => c.type === "grid");
  return {
    id: nextBlockId("grid"),
    type: "grid",
    role: inferRole(content),
    rect: {
      x: rectUnit === "px" ? Math.round(x) : clampInt(x, -100, 100),
      y: rectUnit === "px" ? Math.round(y) : clampInt(y, -100, 100),
      width: Math.max(1, Math.round(width)),
      height: Math.max(1, Math.round(height))
    },
    content: cleanedContent,
    className: attrs.class || "",
    style: attrs.style || "",
    pad: attrs.pad || "",
    align: attrs.align || "",
    flow: attrs.flow || "",
    filter: attrs.filter || "",
    justifyContent: attrs["justify-content"] || "",
    bg: attrs.bg || "",
    border: attrs.border || "",
    animate: attrs.animate || "",
    opacity: attrs.opacity || "",
    rotate: attrs.rotate || "",
    frag: attrs.frag || "",
    extraAttributes: (() => {
      const extra = Object.entries(attrs).reduce(
        (result, [key, value]) => {
          if ([
            "drag",
            "drop",
            "class",
            "style",
            "pad",
            "align",
            "flow",
            "filter",
            "justify-content",
            "bg",
            "border",
            "animate",
            "opacity",
            "rotate",
            "frag"
          ].includes(key)) {
            return result;
          }
          result[key] = value;
          return result;
        },
        {}
      );
      if (rectUnit === "px") {
        extra.rectUnit = "px";
      }
      return extra;
    })(),
    children: children.length > 0 ? children : void 0
  };
}
function parseGridBlocks(markdown, footnotesState, rectUnit, warnings) {
  const blocks = [];
  const { topLevelRanges, segments } = parseGridSegments(markdown);
  if (topLevelRanges.length === 0) {
    appendRawBlocksAndFootnotes(
      markdown,
      blocks,
      footnotesState,
      rectUnit,
      warnings
    );
    return blocks;
  }
  let cursor = 0;
  topLevelRanges.forEach((range) => {
    const before = markdown.slice(cursor, range.start);
    appendRawBlocksAndFootnotes(
      before,
      blocks,
      footnotesState,
      rectUnit,
      warnings
    );
    const segment = segments.find(
      (s) => s.start === range.start && s.end === range.end
    );
    if (segment) {
      blocks.push(
        createGridBlock(
          segment.attrSource,
          segment.content,
          rectUnit,
          warnings
        )
      );
    }
    cursor = range.end;
  });
  appendRawBlocksAndFootnotes(
    markdown.slice(cursor),
    blocks,
    footnotesState,
    rectUnit,
    warnings
  );
  return blocks;
}
function parseDesignPageDraft(pageType, designName, filePath, markdown) {
  const fileName = getDesignPageFileName(pageType, designName);
  const footnotesState = {
    hasFootnotesBlock: false,
    hasSideBarBlock: false
  };
  const { rectUnit: defaultRectUnit, warnings } = detectDefaultRectUnit(markdown);
  const blocks = parseGridBlocks(
    markdown,
    footnotesState,
    defaultRectUnit,
    warnings
  );
  const units = /* @__PURE__ */ new Set();
  const collect = (items) => {
    items.forEach((block) => {
      if (block.type !== "grid")
        return;
      units.add(
        block.extraAttributes.rectUnit === "px" ? "px" : "percent"
      );
      if (block.children)
        collect(block.children);
    });
  };
  collect(blocks);
  const rectUnit = units.has("px") && !units.has("percent") ? "px" : "percent";
  return {
    type: pageType,
    label: getDesignPageDisplayName(fileName),
    fileName,
    filePath,
    blocks,
    rawMarkdown: markdown,
    hasUnsupportedContent: blocks.some((block) => block.type === "raw"),
    rectUnit,
    unitWarnings: warnings.length > 0 ? warnings : void 0
  };
}
function readCssValue(css, key, fallback) {
  var _a;
  const match = css.match(new RegExp(`${key}\\s*:\\s*([^;]+);`));
  return ((_a = match == null ? void 0 : match[1]) == null ? void 0 : _a.trim()) || fallback;
}
function readNumberValue(css, key, fallback) {
  const value = readCssValue(css, key, `${fallback}`);
  const parsed = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}
function parseThemeDraft(designName, cssContent) {
  const lines = cssContent.split("\n");
  const headerDirectives = lines.filter((line) => {
    const trimmed = line.trim();
    return trimmed.startsWith("/* @theme") || trimmed.startsWith("@import");
  });
  const rawCss = lines.filter((line) => !headerDirectives.includes(line)).join("\n").trim();
  return {
    themeName: `sr-design-${designName.toLowerCase()}`,
    primaryColor: readCssValue(rawCss, "--sr-dm-primary", "#0044ff"),
    secondaryColor: readCssValue(rawCss, "--sr-dm-secondary", "#7c3aed"),
    backgroundColor: readCssValue(rawCss, "--sr-dm-background", "#ffffff"),
    textColor: readCssValue(rawCss, "--sr-dm-text", "#111111"),
    headingFont: readCssValue(rawCss, "--sr-dm-heading-font", "inherit"),
    bodyFont: readCssValue(rawCss, "--sr-dm-body-font", "inherit"),
    headingScale: readNumberValue(rawCss, "--sr-dm-heading-scale", 1),
    bodyScale: readNumberValue(rawCss, "--sr-dm-body-scale", 1),
    borderRadius: readNumberValue(rawCss, "--sr-dm-radius", 24),
    shadowOpacity: readNumberValue(rawCss, "--sr-dm-shadow-opacity", 0.18),
    mode: readCssValue(rawCss, "--sr-dm-mode", "light") === "dark" ? "dark" : "light",
    headerDirectives,
    rawCss
  };
}

// src/services/design-maker-generator.ts
function formatRectValue(value) {
  return `${Math.round(value)}`;
}
function serializeAttributes(block, defaultRectUnit) {
  const rectUnit = block.extraAttributes.rectUnit === "px" ? "px" : defaultRectUnit;
  const attrs = {
    drag: rectUnit === "px" ? `${formatRectValue(block.rect.width)}px ${formatRectValue(
      block.rect.height
    )}px` : `${formatRectValue(block.rect.width)} ${formatRectValue(
      block.rect.height
    )}`,
    drop: rectUnit === "px" ? `${formatRectValue(block.rect.x)}px ${formatRectValue(
      block.rect.y
    )}px` : `${formatRectValue(block.rect.x)} ${formatRectValue(block.rect.y)}`
  };
  if (block.className.trim())
    attrs.class = block.className.trim();
  if (block.align.trim())
    attrs.align = block.align.trim();
  if (block.pad.trim())
    attrs.pad = block.pad.trim();
  if (block.style.trim())
    attrs.style = block.style.trim();
  if (block.flow.trim())
    attrs.flow = block.flow.trim();
  if (block.filter.trim())
    attrs.filter = block.filter.trim();
  if (block.bg.trim())
    attrs.bg = block.bg.trim();
  if (block.border.trim())
    attrs.border = block.border.trim();
  if (block.animate.trim())
    attrs.animate = block.animate.trim();
  if (block.opacity.trim())
    attrs.opacity = block.opacity.trim();
  if (block.rotate.trim())
    attrs.rotate = block.rotate.trim();
  if (block.frag.trim())
    attrs.frag = block.frag.trim();
  if (block.justifyContent.trim()) {
    attrs["justify-content"] = block.justifyContent.trim();
  }
  Object.entries(block.extraAttributes).forEach(([key, value]) => {
    if (key === "rectUnit")
      return;
    if (!attrs[key] && value.trim()) {
      attrs[key] = value.trim();
    }
  });
  return Object.entries(attrs).map(([key, value]) => `${key}="${value}"`).join(" ");
}
function generateGridBlock(block, defaultRectUnit) {
  const rectUnit = block.extraAttributes.rectUnit === "px" ? "px" : defaultRectUnit;
  const childrenStr = (block.children || []).map(
    (child) => child.type === "grid" ? generateGridBlock(child, rectUnit) : child.raw.trim()
  ).filter(Boolean).join("\n\n");
  const innerContent = [block.content, childrenStr].filter(Boolean).join("\n\n");
  return `<grid ${serializeAttributes(block, rectUnit)}>
${innerContent}
</grid>`;
}
function generatePageMarkdown(page) {
  var _a;
  const rectUnit = (_a = page.rectUnit) != null ? _a : "percent";
  return page.blocks.map(
    (block) => block.type === "grid" ? generateGridBlock(block, rectUnit) : block.raw.trim()
  ).filter(Boolean).join("\n\n").trim();
}
function generateDesignMakerRuntimeCss(theme) {
  var _a;
  const root = ":where(.slides-rup-design-maker-canvas, .slides-rup-design-maker-preview)";
  const generatedCss = `
${root} {
	--sr-dm-primary: ${theme.primaryColor};
	--sr-dm-secondary: ${theme.secondaryColor};
	--sr-dm-background: ${theme.backgroundColor};
	--sr-dm-text: ${theme.textColor};
	--sr-dm-heading-font: ${theme.headingFont};
	--sr-dm-body-font: ${theme.bodyFont};
	--sr-dm-heading-scale: ${theme.headingScale};
	--sr-dm-body-scale: ${theme.bodyScale};
	--sr-dm-radius: ${theme.borderRadius}px;
	--sr-dm-shadow-opacity: ${theme.shadowOpacity};
	--sr-dm-mode: ${theme.mode};
}

${root} .bg-with-back-color {
	background: var(--sr-dm-primary);
	color: #ffffff;
}

${root} .bg-with-front-color {
	background: color-mix(in srgb, var(--sr-dm-background) 90%, var(--sr-dm-secondary) 10%);
	color: var(--sr-dm-text);
	border-radius: var(--sr-dm-radius);
	box-shadow: 0 18px 40px rgba(15, 23, 42, var(--sr-dm-shadow-opacity));
}

${root} .has-dark-background {
	color: #ffffff;
}

${root} .has-light-background {
	color: var(--sr-dm-text);
}
`.trim();
  const tail = ((_a = theme.rawCss) == null ? void 0 : _a.trim()) ? `

${theme.rawCss.trim()}
` : "\n";
  return `${generatedCss}${tail}`;
}

// src/ui/components/design-block-renderer.ts
var import_obsidian3 = require("obsidian");

// src/ui/components/design-canvas.ts
function clampCanvasZoomPercent(value) {
  if (!Number.isFinite(value))
    return 100;
  return Math.max(25, Math.min(400, Math.round(value)));
}
function computeBaselineScale(options) {
  const { frameWidth, frameHeight, baseWidth, baseHeight } = options;
  if (!frameWidth || !frameHeight || !baseWidth || !baseHeight)
    return 1;
  return Math.min(frameWidth / baseWidth, frameHeight / baseHeight);
}
function computeCanvasTransform(options) {
  const zoomPercent = clampCanvasZoomPercent(options.zoomPercent);
  const zoomScale = zoomPercent / 100;
  const baselineScale = computeBaselineScale(options);
  const scale = baselineScale * zoomScale;
  const panX = Number.isFinite(options.panX) ? options.panX : 0;
  const panY = Number.isFinite(options.panY) ? options.panY : 0;
  return {
    scale,
    transform: `translate(${panX}px, ${panY}px) scale(${scale})`
  };
}
function computePanForZoom(options) {
  const { cursorX, cursorY, panX, panY, currentScale, nextScale } = options;
  if (!Number.isFinite(currentScale) || currentScale <= 0) {
    return { panX, panY };
  }
  const ratio = nextScale / currentScale;
  const nextPanX = cursorX - ratio * (cursorX - panX);
  const nextPanY = cursorY - ratio * (cursorY - panY);
  return {
    panX: Number.isFinite(nextPanX) ? nextPanX : panX,
    panY: Number.isFinite(nextPanY) ? nextPanY : panY
  };
}

// src/yamlStore.ts
var YamlStore = class {
  constructor() {
  }
  static getInstance() {
    if (!YamlStore.instance) {
      YamlStore.instance = new YamlStore();
    }
    return YamlStore.instance;
  }
};

// src/transformers/gridTransformer.ts
var GridTransformer = class {
  constructor() {
    this.gridAttributeRegex = /^(?:(-?\d+(?:px)?)(?:\s*|x)(-?\d+(?:px)?)|(center|top|bottom|left|right|topleft|topright|bottomleft|bottomright))$/m;
    this.maxWidth = YamlStore.getInstance().options.width;
    this.maxHeight = YamlStore.getInstance().options.height;
    this.isCenter = YamlStore.getInstance().options.center;
  }
  transform(element) {
    var _a, _b;
    let defaultDrop;
    let defaultUnit;
    const isAbsolute = element.getAttribute("absolute") == "true";
    if (isAbsolute) {
      defaultDrop = "480px 700px";
      defaultUnit = "px";
    } else {
      defaultDrop = "50 100";
      defaultUnit = "%";
    }
    const drop = element.getAttribute("drop");
    if (drop != void 0) {
      const drag = (_a = element.getAttribute("drag")) != null ? _a : defaultDrop;
      const grid = this.read(drag, drop, isAbsolute);
      if (grid != void 0) {
        const left = this.leftOf(grid) + defaultUnit;
        const top = this.topOf(grid) + defaultUnit;
        const height = this.heightOf(grid) + defaultUnit;
        const width = this.widthOf(grid) + defaultUnit;
        element.addStyle("position", "absolute");
        element.addStyle("left", left);
        element.addStyle("top", top);
        element.addStyle("height", height);
        element.addStyle("width", width);
        if (isAbsolute) {
          element.addStyle("min-height", height);
        }
        element.deleteAttribute("drag");
        element.deleteAttribute("drop");
      }
    }
    if (element.getAttribute("align") || drop) {
      const flow = element.getAttribute("flow");
      const [align, alignItems, justifyContent, stretch] = this.getAlignment(element.getAttribute("align"), flow);
      const justifyCtx = (_b = element.getAttribute("justify-content")) != null ? _b : justifyContent;
      if (align) {
        element.addAttribute("align", align, false);
      }
      if (stretch) {
        element.addClass(stretch);
      }
      switch (flow) {
        case "row":
          element.addStyle("display", "flex");
          element.addStyle("flex-direction", "row");
          element.addStyle("align-items", alignItems);
          element.addStyle("justify-content", justifyCtx);
          element.addClass("flex-even");
          break;
        case "col":
        default:
          element.addStyle("display", "flex");
          element.addStyle("flex-direction", "column");
          element.addStyle("align-items", alignItems);
          element.addStyle("justify-content", justifyCtx);
          break;
      }
      if (this.isCenter != void 0 && !this.isCenter) {
        element.addStyle("align-items", "start");
      }
      element.deleteAttribute("flow");
      element.deleteAttribute("justify-content");
    }
  }
  getAlignment(input, flow) {
    const direction = flow != null ? flow : "col";
    switch (input) {
      case "topleft":
        if (direction == "col") {
          return ["left", "flex-start", "flex-start", void 0];
        } else {
          return ["left", "flex-start", "space-evenly", void 0];
        }
      case "topright":
        if (direction == "col") {
          return ["right", "flex-end", "flex-start", void 0];
        } else {
          return ["right", "flex-start", "space-evenly", void 0];
        }
      case "bottomright":
        if (direction == "col") {
          return ["right", "flex-end", "flex-end", void 0];
        } else {
          return ["right", "flex-end", "space-evenly", void 0];
        }
      case "bottomleft":
        if (direction == "col") {
          return ["left", "flex-start", "flex-end", void 0];
        } else {
          return ["left", "flex-end", "space-evenly", void 0];
        }
      case "left":
        if (direction == "col") {
          return ["left", "flex-start", "space-evenly", void 0];
        } else {
          return ["left", "center", "space-evenly", void 0];
        }
      case "right":
        if (direction == "col") {
          return ["right", "flex-end", "space-evenly", void 0];
        } else {
          return ["right", "center", "space-evenly", void 0];
        }
      case "top":
        if (direction == "col") {
          return [void 0, "center", "flex-start", void 0];
        } else {
          return [void 0, "flex-start", "space-evenly", void 0];
        }
      case "bottom":
        if (direction == "col") {
          return [void 0, "center", "flex-end", void 0];
        } else {
          return [void 0, "flex-end", "space-evenly", void 0];
        }
      case "stretch":
        if (direction == "col") {
          return [
            void 0,
            "center",
            "space-evenly",
            "stretch-column"
          ];
        } else {
          return [void 0, "center", "space-evenly", "stretch-row"];
        }
      case "block":
      case "justify":
        return ["justify", "center", "space-evenly", void 0];
      case "center":
      default:
        return [void 0, "center", "center", void 0];
    }
  }
  read(drag, drop, isAbsolute) {
    try {
      const result = /* @__PURE__ */ new Map();
      result.set("slideWidth", this.maxWidth);
      result.set("slideHeight", this.maxHeight);
      if (isAbsolute) {
        result.set("maxWidth", this.maxWidth);
        result.set("maxHeight", this.maxHeight);
        return this.readValues(drag, drop, result, this.toPixel);
      } else {
        result.set("maxWidth", 100);
        result.set("maxHeight", 100);
        return this.readValues(
          drag,
          drop,
          result,
          this.toRelativeValue
        );
      }
    } catch (ex) {
      return void 0;
    }
  }
  readValues(drag, drop, result, valueTransformer) {
    try {
      const dragMatch = this.gridAttributeRegex.exec(drag);
      const dropMatch = this.gridAttributeRegex.exec(drop);
      const width = dragMatch == null ? void 0 : dragMatch[1];
      const height = dragMatch == null ? void 0 : dragMatch[2];
      const x = dropMatch == null ? void 0 : dropMatch[1];
      const y = dropMatch == null ? void 0 : dropMatch[2];
      const name = dropMatch == null ? void 0 : dropMatch[3];
      const parsedWidth = width ? this.parseWidthOrHeight(width) : null;
      const parsedHeight = height ? this.parseWidthOrHeight(height) : null;
      if (!parsedWidth || !parsedHeight)
        return void 0;
      result.set(
        "width",
        valueTransformer(result.get("slideWidth"), parsedWidth)
      );
      result.set(
        "height",
        valueTransformer(result.get("slideHeight"), parsedHeight)
      );
      if (name) {
        const [nx, ny] = this.getXYof(
          name,
          result.get("width"),
          result.get("height"),
          result.get("maxWidth"),
          result.get("maxHeight")
        );
        result.set("x", nx);
        result.set("y", ny);
      } else {
        if (x) {
          const parsedX = this.parseXY(x);
          if (!parsedX)
            return void 0;
          result.set(
            "x",
            valueTransformer(result.get("slideWidth"), parsedX)
          );
        } else {
          return void 0;
        }
        if (y) {
          const parsedY = this.parseXY(y);
          if (!parsedY)
            return void 0;
          result.set(
            "y",
            valueTransformer(result.get("slideHeight"), parsedY)
          );
        } else {
          return void 0;
        }
      }
      return result;
    } catch (ex) {
      return void 0;
    }
  }
  parseWidthOrHeight(input) {
    const trimmed = input.trim();
    if (!trimmed)
      return null;
    if (trimmed.toLowerCase().endsWith("px")) {
      const raw = trimmed.slice(0, -2).trim();
      if (!/^\d+$/.test(raw))
        return null;
      const px = Number(raw);
      if (!Number.isFinite(px) || px <= 0)
        return null;
      return `${Math.round(px)}px`;
    }
    if (!/^\d+$/.test(trimmed))
      return null;
    const ratio = Number(trimmed);
    if (!Number.isFinite(ratio) || ratio <= 0)
      return null;
    return `${Math.round(ratio)}`;
  }
  parseXY(input) {
    const trimmed = input.trim();
    if (!trimmed)
      return null;
    if (trimmed.toLowerCase().endsWith("px")) {
      const raw = trimmed.slice(0, -2).trim();
      if (!/^-?\d+$/.test(raw))
        return null;
      const px = Number(raw);
      if (!Number.isFinite(px))
        return null;
      return `${Math.round(px)}px`;
    }
    if (!/^-?\d+$/.test(trimmed))
      return null;
    const ratio = Number(trimmed);
    if (!Number.isFinite(ratio))
      return null;
    return `${Math.round(ratio)}`;
  }
  toRelativeValue(max, input) {
    if (input.toLowerCase().endsWith("px")) {
      return Number(input.toLowerCase().replace("px", "").trim()) / max * 100;
    } else {
      return Number(input);
    }
  }
  toPixel(max, input) {
    if (input.toLowerCase().endsWith("px")) {
      return Number(input.toLowerCase().replace("px", "").trim());
    } else {
      return max / 100 * Number(input);
    }
  }
  getXYof(name, width, height, maxWidth, maxHeight) {
    switch (name) {
      case "topleft":
        return [0, 0];
      case "topright":
        return [maxWidth - width, 0];
      case "bottomleft":
        return [0, maxHeight - height];
      case "bottomright":
        return [maxWidth - width, maxHeight - height];
      case "left":
        return [0, (maxHeight - height) / 2];
      case "right":
        return [maxWidth - width, (maxHeight - height) / 2];
      case "top":
        return [(maxWidth - width) / 2, 0];
      case "bottom":
        return [(maxWidth - width) / 2, maxHeight - height];
      case "center":
        return [(maxWidth - width) / 2, (maxHeight - height) / 2];
      default:
        return [0, 0];
    }
  }
  leftOf(grid) {
    if (grid.get("x") < 0) {
      return grid.get("maxWidth") + grid.get("x") - grid.get("width");
    } else {
      return grid.get("x");
    }
  }
  topOf(grid) {
    if (grid.get("y") < 0) {
      return grid.get("maxHeight") + grid.get("y") - grid.get("height");
    } else {
      return grid.get("y");
    }
  }
  heightOf(grid) {
    return grid.get("height");
  }
  widthOf(grid) {
    return grid.get("width");
  }
};

// src/__tests__/test.ts
var originalRequire = module2.Module.prototype.require;
module2.Module.prototype.require = function(...args) {
  if (args[0] === "obsidian")
    return {};
  return originalRequire.apply(this, args);
};
function testNestedGridSerialization() {
  const markdown = `<grid drag="70 140" drop="-32 0" class="bg-with-front-color" style="margin-top: -216px" rotate="350">

<grid drag="5 40" drop="97 36" class="bg-with-back-color">

</grid>
</grid>`;
  const draft = parseDesignPageDraft("cover", "test", "test.md", markdown);
  import_assert.default.strictEqual(draft.blocks.length, 1, "Should have 1 top-level block");
  const outerGrid = draft.blocks[0];
  import_assert.default.strictEqual(outerGrid.type, "grid");
  import_assert.default.strictEqual(
    outerGrid.children.length,
    1,
    "Should have 1 child grid"
  );
  const innerGrid = outerGrid.children[0];
  import_assert.default.strictEqual(innerGrid.rect.width, 5);
  import_assert.default.strictEqual(innerGrid.rect.height, 40);
  import_assert.default.strictEqual(innerGrid.rect.x, 97);
  import_assert.default.strictEqual(innerGrid.rect.y, 36);
  const generated = generatePageMarkdown(draft);
  const reParsed = parseDesignPageDraft(
    "cover",
    "test",
    "test.md",
    generated
  );
  import_assert.default.strictEqual(reParsed.blocks.length, 1);
  import_assert.default.strictEqual(reParsed.blocks[0].children.length, 1);
  console.log("testNestedGridSerialization passed");
}
function testCoordinateConversion() {
  class MockDOMRect {
    constructor(left, top, width, height) {
      this.left = left;
      this.top = top;
      this.width = width;
      this.height = height;
    }
  }
  const globalRect = new MockDOMRect(150, 150, 50, 50);
  const parentRect = new MockDOMRect(100, 100, 200, 200);
  const newX = (globalRect.left - parentRect.left) / parentRect.width * 100;
  const newY = (globalRect.top - parentRect.top) / parentRect.height * 100;
  const newWidth = globalRect.width / parentRect.width * 100;
  const newHeight = globalRect.height / parentRect.height * 100;
  import_assert.default.strictEqual(newX, 25);
  import_assert.default.strictEqual(newY, 25);
  import_assert.default.strictEqual(newWidth, 25);
  import_assert.default.strictEqual(newHeight, 25);
  console.log("testCoordinateConversion passed");
}
function testTreeCircularDependency() {
  var _a;
  const blocks = [
    {
      id: "A",
      type: "grid",
      children: [
        {
          id: "B",
          type: "grid",
          children: [{ id: "C", type: "grid" }]
        }
      ]
    }
  ];
  const _findBlockById = (blocksArr, id) => {
    for (let i = 0; i < blocksArr.length; i++) {
      const block = blocksArr[i];
      if (block.id === id)
        return { block, index: i };
      if (block.type === "grid" && block.children) {
        const found = _findBlockById(block.children, id);
        if (found)
          return __spreadProps(__spreadValues({}, found), { parent: block });
      }
    }
    return null;
  };
  const sourceId = "A";
  const targetId = "C";
  let hasCircular = false;
  const targetFound = _findBlockById(blocks, targetId);
  if (targetFound && targetFound.block.type === "grid") {
    let currentCheck = targetFound.parent;
    while (currentCheck) {
      if (currentCheck.id === sourceId) {
        hasCircular = true;
        break;
      }
      currentCheck = (_a = _findBlockById(blocks, currentCheck.id)) == null ? void 0 : _a.parent;
    }
  }
  import_assert.default.strictEqual(
    hasCircular,
    true,
    "Should detect circular dependency when dropping A into C"
  );
  console.log("testTreeCircularDependency passed");
}
function testDesignMakerRuntimeCssHasHelperClasses() {
  const theme = parseThemeDraft("Test", "");
  const css = generateDesignMakerRuntimeCss(theme);
  import_assert.default.ok(
    css.includes(".bg-with-front-color"),
    "Should include .bg-with-front-color helper class"
  );
  import_assert.default.ok(
    css.includes(".bg-with-back-color"),
    "Should include .bg-with-back-color helper class"
  );
  import_assert.default.ok(
    css.includes(".slides-rup-design-maker-canvas") || css.includes(".slides-rup-design-maker-preview"),
    "Should scope helper CSS to Design Maker containers"
  );
  console.log("testDesignMakerRuntimeCssHasHelperClasses passed");
}
function testSelectionDebounceStateMachine() {
  const machine = (() => {
    let lastApplied = null;
    let selected = null;
    return {
      select(next) {
        selected = next;
      },
      apply() {
        const previous = lastApplied;
        const next = selected;
        lastApplied = next;
        return { previous, next };
      }
    };
  })();
  machine.select("A");
  machine.select("B");
  machine.select("C");
  const first = machine.apply();
  import_assert.default.deepStrictEqual(first, { previous: null, next: "C" });
  machine.select(null);
  const second = machine.apply();
  import_assert.default.deepStrictEqual(second, { previous: "C", next: null });
  console.log("testSelectionDebounceStateMachine passed");
}
function testNestedBlockVisibilityToggle() {
  var _a, _b;
  const findById = (blocks2, id) => {
    for (const block of blocks2) {
      if (block.id === id)
        return block;
      if (block.type === "grid" && block.children) {
        const found = findById(block.children, id);
        if (found)
          return found;
      }
    }
    return null;
  };
  const blocks = [
    {
      id: "parent",
      type: "grid",
      children: [{ id: "child", type: "grid" }]
    }
  ];
  const child = findById(blocks, "child");
  import_assert.default.ok(child, "Should find nested child block");
  import_assert.default.strictEqual(child.hiddenInDesign, void 0);
  child.hiddenInDesign = true;
  import_assert.default.strictEqual((_a = findById(blocks, "child")) == null ? void 0 : _a.hiddenInDesign, true);
  const parent = findById(blocks, "parent");
  import_assert.default.ok(parent, "Should find parent block");
  parent.hiddenInDesign = true;
  parent.hiddenInDesign = false;
  import_assert.default.strictEqual((_b = findById(blocks, "parent")) == null ? void 0 : _b.hiddenInDesign, false);
  console.log("testNestedBlockVisibilityToggle passed");
}
function testCanvasZoomTransformMath() {
  import_assert.default.strictEqual(clampCanvasZoomPercent(0), 25);
  import_assert.default.strictEqual(clampCanvasZoomPercent(500), 400);
  import_assert.default.strictEqual(clampCanvasZoomPercent(123.4), 123);
  const transform = computeCanvasTransform({
    frameWidth: 960,
    frameHeight: 540,
    baseWidth: 1920,
    baseHeight: 1080,
    zoomPercent: 200,
    panX: 10,
    panY: 20
  });
  import_assert.default.strictEqual(transform.scale, 1);
  import_assert.default.strictEqual(transform.transform, "translate(10px, 20px) scale(1)");
  const resetTransform = computeCanvasTransform({
    frameWidth: 960,
    frameHeight: 540,
    baseWidth: 1920,
    baseHeight: 1080,
    zoomPercent: 100,
    panX: 0,
    panY: 0
  });
  import_assert.default.strictEqual(resetTransform.scale, 0.5);
  import_assert.default.strictEqual(
    resetTransform.transform,
    "translate(0px, 0px) scale(0.5)"
  );
  const nextPan = computePanForZoom({
    cursorX: 100,
    cursorY: 100,
    panX: 0,
    panY: 0,
    currentScale: 1,
    nextScale: 2
  });
  import_assert.default.deepStrictEqual(nextPan, { panX: -100, panY: -100 });
  console.log("testCanvasZoomTransformMath passed");
}
function testDesignTemplateUnitConsistency() {
  const pxMarkdown = `<grid drag="80px 100px" drop="10px 20px" class="bg-with-front-color">
</grid>`;
  const pxPage = parseDesignPageDraft(
    "content",
    "test",
    "test.md",
    pxMarkdown
  );
  import_assert.default.strictEqual(
    pxPage.rectUnit,
    "px",
    "Should detect px unit from template"
  );
  const pxSerialized = generatePageMarkdown(pxPage);
  import_assert.default.ok(
    pxSerialized.includes(`drag="80px 100px"`),
    "Should keep px unit in drag on save"
  );
  import_assert.default.ok(
    pxSerialized.includes(`drop="10px 20px"`),
    "Should keep px unit in drop on save"
  );
  const percentMarkdown = `<grid drag="100 80" drop="0 0" class="bg-with-front-color">
</grid>`;
  const percentPage = parseDesignPageDraft(
    "content",
    "test",
    "test.md",
    percentMarkdown
  );
  import_assert.default.strictEqual(
    percentPage.rectUnit,
    "percent",
    "Should detect percent unit from bare numbers"
  );
  const mixedUserMarkdown = `<grid drag="200px 200px" drop="45 20">
</grid>`;
  const mixedUserPage = parseDesignPageDraft(
    "content",
    "test",
    "test.md",
    mixedUserMarkdown
  );
  import_assert.default.strictEqual(
    mixedUserPage.rectUnit,
    "px",
    "Block with any px should be parsed as px unit overall"
  );
  const mixedUserGrid = mixedUserPage.blocks[0];
  import_assert.default.strictEqual(
    mixedUserGrid.rect.width,
    200,
    "Width should be parsed as 200px"
  );
  import_assert.default.strictEqual(
    mixedUserGrid.rect.height,
    200,
    "Height should be parsed as 200px"
  );
  import_assert.default.strictEqual(
    mixedUserGrid.rect.x,
    45,
    "X should be parsed as 45px due to pure number normalization"
  );
  import_assert.default.strictEqual(
    mixedUserGrid.rect.y,
    20,
    "Y should be parsed as 20px due to pure number normalization"
  );
  const mixedPercentMarkdown = `<grid drag="200px 200px" drop="50% 100">
</grid>`;
  const mixedPercentPage = parseDesignPageDraft(
    "content",
    "test",
    "test.md",
    mixedPercentMarkdown
  );
  const mixedPercentGrid = mixedPercentPage.blocks[0];
  import_assert.default.strictEqual(
    mixedPercentGrid.rect.x,
    960,
    "X should be 960px (50% of 1920)"
  );
  import_assert.default.strictEqual(
    mixedPercentGrid.rect.y,
    100,
    "Y should be 100px due to pure number normalization"
  );
  const mixedMarkdown = `<grid drag="80px 100px" drop="0px 0px">
</grid>

<grid drag="100 80" drop="0 0">
</grid>`;
  const mixedPage = parseDesignPageDraft(
    "content",
    "test",
    "test.md",
    mixedMarkdown
  );
  import_assert.default.strictEqual(
    mixedPage.rectUnit,
    "percent",
    "Mixed blocks should not force whole page to px"
  );
  const mixedGridA = mixedPage.blocks[0];
  const mixedGridB = mixedPage.blocks[1];
  import_assert.default.strictEqual(
    mixedGridA.extraAttributes.rectUnit,
    "px",
    "Px block should keep rectUnit=px"
  );
  import_assert.default.ok(
    !mixedGridB.extraAttributes.rectUnit,
    "Percent block should not be marked as px"
  );
  const mixedSerialized = generatePageMarkdown(mixedPage);
  import_assert.default.ok(
    mixedSerialized.includes(`drag="80px 100px"`),
    "Px block should serialize drag with px"
  );
  import_assert.default.ok(
    mixedSerialized.includes(`drag="100 80"`),
    "Percent block should serialize drag as bare numbers"
  );
  const remMarkdown = `<grid drag="2rem 3rem" drop="1rem 1rem">
</grid>`;
  const remPage = parseDesignPageDraft(
    "content",
    "test",
    "test.md",
    remMarkdown
  );
  import_assert.default.strictEqual(
    remPage.rectUnit,
    "percent",
    "Unsupported unit should not switch to px by itself"
  );
  import_assert.default.ok(
    (remPage.unitWarnings || []).length > 0,
    "Should warn for unsupported units"
  );
  const remSerialized = generatePageMarkdown(remPage);
  import_assert.default.ok(
    remSerialized.includes(`drag="2 3"`),
    "Unsupported units should be auto-corrected to numbers"
  );
  const pxLabel = formatRectInputValue(80, "px");
  const percentLabel = formatRectInputValue(100, "percent");
  import_assert.default.strictEqual(pxLabel, "80px", "Inspector should show px suffix");
  import_assert.default.strictEqual(
    percentLabel,
    "100",
    "Inspector should show bare number"
  );
  import_assert.default.deepStrictEqual(parseRectInputValue("80px"), {
    value: 80,
    rectUnit: "px"
  });
  import_assert.default.deepStrictEqual(parseRectInputValue("100"), {
    value: 100,
    rectUnit: "percent"
  });
  import_assert.default.strictEqual(
    normalizeCoordinateString("100"),
    "100px",
    "Should add px to pure number"
  );
  import_assert.default.strictEqual(
    normalizeCoordinateString("100px"),
    "100px",
    "Should keep px unchanged"
  );
  import_assert.default.strictEqual(
    normalizeCoordinateString("50%"),
    "50%",
    "Should keep percent unchanged"
  );
  import_assert.default.strictEqual(
    normalizeCoordinateString("50% 100"),
    "50% 100px",
    "Should handle mixed units correctly"
  );
  import_assert.default.deepStrictEqual(parseRectInputValue("100", "px"), {
    value: 100,
    rectUnit: "px"
  });
  import_assert.default.deepStrictEqual(parseRectInputValue("100", "percent"), {
    value: 100,
    rectUnit: "percent"
  });
  import_assert.default.deepStrictEqual(parseRectInputValue("50%", "px"), {
    value: 50,
    rectUnit: "percent"
  });
  const baseWidth = 1920;
  const widthPercent = 50;
  const expectedPx = baseWidth * widthPercent / 100;
  const actualPx = baseWidth * widthPercent / 100;
  import_assert.default.ok(
    Math.abs(actualPx - expectedPx) <= 1,
    "Percent-to-px rendering math should be within \xB11px"
  );
  console.log("testDesignTemplateUnitConsistency passed");
}
function testAdvancedSlidesWidthHeightParsing() {
  var _a, _b;
  YamlStore.getInstance().options = {
    width: 1920,
    height: 1080,
    center: true
  };
  const transformer = new GridTransformer();
  const relRatio = transformer.read("5 12", "0 0", false);
  import_assert.default.ok(relRatio, "Relative ratio should parse");
  import_assert.default.strictEqual(relRatio == null ? void 0 : relRatio.get("width"), 5);
  import_assert.default.strictEqual(relRatio == null ? void 0 : relRatio.get("height"), 12);
  import_assert.default.strictEqual(relRatio == null ? void 0 : relRatio.get("x"), 0);
  import_assert.default.strictEqual(relRatio == null ? void 0 : relRatio.get("y"), 0);
  const relPx = transformer.read("200px 300px", "0 0", false);
  import_assert.default.ok(relPx, "Relative px should parse");
  import_assert.default.ok(
    Math.abs(((_a = relPx == null ? void 0 : relPx.get("width")) != null ? _a : 0) - 10.4166667) < 0.01,
    "Relative px width should convert to percentage"
  );
  import_assert.default.ok(
    Math.abs(((_b = relPx == null ? void 0 : relPx.get("height")) != null ? _b : 0) - 27.7777778) < 0.01,
    "Relative px height should convert to percentage"
  );
  const absRatio = transformer.read("5 10", "0 0", true);
  import_assert.default.ok(absRatio, "Absolute ratio should parse");
  import_assert.default.strictEqual(absRatio == null ? void 0 : absRatio.get("width"), 96);
  import_assert.default.strictEqual(absRatio == null ? void 0 : absRatio.get("height"), 108);
  const absPx = transformer.read("200px 300px", "0 0", true);
  import_assert.default.ok(absPx, "Absolute px should parse");
  import_assert.default.strictEqual(absPx == null ? void 0 : absPx.get("width"), 200);
  import_assert.default.strictEqual(absPx == null ? void 0 : absPx.get("height"), 300);
  const relNegXY = transformer.read("5 5", "-10 20", false);
  import_assert.default.ok(relNegXY, "Relative negative XY should parse");
  import_assert.default.strictEqual(relNegXY == null ? void 0 : relNegXY.get("x"), -10);
  import_assert.default.strictEqual(relNegXY == null ? void 0 : relNegXY.get("y"), 20);
  const absNegPxXY = transformer.read("5 5", "-20px 30px", true);
  import_assert.default.ok(absNegPxXY, "Absolute px negative XY should parse");
  import_assert.default.strictEqual(absNegPxXY == null ? void 0 : absNegPxXY.get("x"), -20);
  import_assert.default.strictEqual(absNegPxXY == null ? void 0 : absNegPxXY.get("y"), 30);
  import_assert.default.strictEqual(
    transformer.read("0px 300px", "0 0", false),
    void 0,
    "Invalid px width should be rejected"
  );
  import_assert.default.strictEqual(
    transformer.read("5.5 10", "0 0", false),
    void 0,
    "Invalid ratio width should be rejected"
  );
  import_assert.default.strictEqual(
    transformer.read("-5 10", "0 0", false),
    void 0,
    "Negative ratio width should be rejected"
  );
  console.log("testAdvancedSlidesWidthHeightParsing passed");
}
function runTests() {
  try {
    globalThis.window = {
      app: {
        plugins: {
          plugins: {
            "slides-rup": {
              settings: {
                slidesRupRunningLanguage: "en"
              }
            }
          }
        }
      }
    };
    testNestedGridSerialization();
    testCoordinateConversion();
    testTreeCircularDependency();
    testDesignMakerRuntimeCssHasHelperClasses();
    testSelectionDebounceStateMachine();
    testNestedBlockVisibilityToggle();
    testCanvasZoomTransformMath();
    testDesignTemplateUnitConsistency();
    testAdvancedSlidesWidthHeightParsing();
    console.log("All tests passed 100%!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
runTests();
