// SPDX-License-Identifier: MPL-2.0

use std::{
    fs::{self, File, OpenOptions},
    io::{self, prelude::*},
    os,
    path::{Path, PathBuf},
};
use trash;

pub fn ls(dir: &Path) -> io::Result<Vec<PathBuf>> {
    let mut files: Vec<PathBuf> = Vec::new();
    let paths = fs::read_dir(dir)?;
    for path in paths {
        let path = path.unwrap().path();
        files.push(path);
    }
    Ok(files)
}

pub fn symlink(original: &Path, link: &Path) -> io::Result<()> {
    #[cfg(target_family = "unix")]
    {
        os::unix::fs::symlink(original, link)
    }
    #[cfg(target_family = "windows")]
    {
        os::windows::fs::symlink_file(original, link)
    }
}

pub fn rm(target: &Path) -> Result<(), trash::Error> {
    if !target.exists() {
        return Ok(());
    }
    trash::delete(target)
}
