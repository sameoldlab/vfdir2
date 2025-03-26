// SPDX-License-Identifier: MPL-2.0 

use std::{
 fs::{self, File, OpenOptions},
 io::{self, prelude::*},
 path::{Path, PathBuf},
};
use trash;
#[cfg(target_family = "unix")]
use std::os::unix;
#[cfg(target_family = "windows")]
use std::os::windows;

pub fn ls(dir: &Path) -> io::Result<Vec<PathBuf>> {
    let mut files: Vec<PathBuf> = Vec::new();
    let paths = fs::read_dir(dir).unwrap();
    for path in paths {
        let path = path.unwrap().path();
        files.push(path);
    }
    Ok(files)
}

pub fn symlink(original: &Path, link: &Path) -> io::Result<()> {
    #[cfg(target_family = "unix")] {
        unix::fs::symlink(original, link)
    }
    #[cfg(target_family = "windows")] {
        windows::fs::symlink_file(original, link)
    }
}

pub fn rm(target: &Path) -> Result<(), trash::Error> {
    if !target.exists() {
        return Ok(());
    }
    trash::delete(target)
}
