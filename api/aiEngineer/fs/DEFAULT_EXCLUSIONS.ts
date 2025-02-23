export const DEFAULT_EXCLUSIONS: string[] = [
  // Binary files and media
  "**/*.lockb",
  "**/*.lock",
  "**/*.jpg",
  "**/*.jpeg",
  "**/*.png",
  "**/*.gif",
  "**/*.bmp",
  "**/*.ico",
  "**/*.webp",
  "**/*.tiff",
  "**/*.mp3",
  "**/*.wav",
  "**/*.mp4",
  "**/*.avi",
  "**/*.mov",
  "**/*.wmv",
  "**/*.flv",
  "**/*.mkv",
  "**/*.m4v",
  "**/*.m4a",
  "**/*.zip",
  "**/*.tar",
  "**/*.gz",
  "**/*.7z",
  "**/*.rar",
  "**/*.exe",
  "**/*.dll",
  "**/*.so",
  "**/*.dylib",
  "**/*.bin",
  "**/*.dat",
  "**/*.db",
  "**/*.sqlite",
  "**/*.sqlite3",

  // Documents and office files
  "**/*.pdf",
  "**/*.doc",
  "**/*.docx",
  "**/*.xlsx",
  "**/*.xls",
  "**/*.xlsm",
  "**/*.xlsb",
  "**/*.pptx",
  "**/*.ppt",
  "**/*.odt",
  "**/*.ods",
  "**/*.odp",
  "**/*.pages",
  "**/*.numbers",
  "**/*.key",
  "**/*.rtf",

  // Design files
  "**/*.psd",
  "**/*.ai",
  "**/*.sketch",
  "**/*.fig",
  "**/*.xd",
  "**/*.excalidraw",
  "**/*.drawio",

  // Project specific
  "**/:memory:/*",
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/coverage/**",
  "**/out/**",
  "**/output/**",
  "**/target/**",
  "**/.next/**",
  "**/vendor/**",
  "**/_generated/**",
  "**/_genql/**",

  // IDE and editor files
  "**/.idea/**",
  "**/.vscode/**",
  "**/.vs/**",
  "**/*.sublime-*",

  // System files
  "**/.DS_Store",
  "**/Thumbs.db",
  "**/*.lnk",

  // Package manager files
  "**/package-lock.json",
  "**/yarn.lock",
  "**/pnpm-lock.yaml",
  "**/bun.lockb",
  "**/requirements.txt",
  "**/poetry.lock",
  "**/Gemfile.lock",
  "**/composer.lock",
  "**/cargo.lock",
  "**/.nuget/**",

  // Config and generated files
  "**/.env*",
  "**/*.min.js",
  "**/*.min.css",
  "**/*.map",
  "**/*.po",
  "**/*.mo",
  "**/*.pot",
  "**/CHANGELOG*",
  "**/LICENSE*",
  "**/.gitignore",
  "**/.gitattributes",
  "**/.dockerignore",
  "**/public/**",
  "**/static/**",
  "**/assets/**",
  "**/migrations/meta/**",
  "**/*.patch",
  "**/*.Designer.cs",
  "**/*.Designer.vb",
  "**/*.vbhtml",
  "**/*.edmx",
  "**/*.vbproj",
  "**/*.csproj",
  "**/*.xlsb",

  // Log and cache files
  "**/*.log",
  "**/*.cache",
  "**/cache/**",
  "**/logs/**",
  "**/.npm/**",
  "**/.yarn/**",

  // Test and mock data
  "**/__snapshots__/**",
  "**/*.snap",
  "**/fixtures/**",
  "**/test/data/**",
  "**/mock/data/**",

  // Temporary files
  "**/*~",
  "**/*.bak",
  "**/*.swp",
  "**/*.tmp",
  "**/tmp/**",
  "**/temp/**",
];
