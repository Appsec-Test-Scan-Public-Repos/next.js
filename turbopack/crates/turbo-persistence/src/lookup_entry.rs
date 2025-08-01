use crate::{
    ArcSlice,
    constants::MAX_SMALL_VALUE_SIZE,
    static_sorted_file_builder::{Entry, EntryValue},
};

/// A value from a SST file lookup.
pub enum LookupValue {
    /// The value was deleted.
    Deleted,
    /// The value is stored in the SST file.
    Slice { value: ArcSlice<u8> },
    /// The value is stored in a blob file.
    Blob { sequence_number: u32 },
}

/// A value from a SST file lookup.
pub enum IterValue<'l> {
    /// A LookupValue
    Value(LookupValue),
    /// A medium sized value that is still compressed.
    MediumCompressed {
        uncompressed_size: u32,
        block: &'l [u8],
    },
}

impl IterValue<'_> {
    /// Returns the size of the value in the SST file.
    pub fn size_in_sst(&self) -> usize {
        match self {
            IterValue::Value(LookupValue::Slice { value }) => value.len(),
            IterValue::Value(LookupValue::Deleted) => 0,
            IterValue::Value(LookupValue::Blob { .. }) => 0,
            IterValue::MediumCompressed {
                uncompressed_size, ..
            } => *uncompressed_size as usize,
        }
    }
}

/// An entry from a SST file lookup.
pub struct IterEntry<'l> {
    /// The hash of the key.
    pub hash: u64,
    /// The key.
    pub key: ArcSlice<u8>,
    /// The value.
    pub value: IterValue<'l>,
}

impl Entry for IterEntry<'_> {
    fn key_hash(&self) -> u64 {
        self.hash
    }

    fn key_len(&self) -> usize {
        self.key.len()
    }

    fn write_key_to(&self, buf: &mut Vec<u8>) {
        buf.extend_from_slice(&self.key);
    }

    fn value(&self) -> EntryValue<'_> {
        match &self.value {
            IterValue::Value(LookupValue::Deleted) => EntryValue::Deleted,
            IterValue::Value(LookupValue::Slice { value }) => {
                if value.len() > MAX_SMALL_VALUE_SIZE {
                    EntryValue::Medium { value }
                } else {
                    EntryValue::Small { value }
                }
            }
            IterValue::Value(LookupValue::Blob { sequence_number }) => EntryValue::Large {
                blob: *sequence_number,
            },
            IterValue::MediumCompressed {
                uncompressed_size,
                block,
            } => EntryValue::MediumCompressed {
                uncompressed_size: *uncompressed_size,
                block,
            },
        }
    }
}
