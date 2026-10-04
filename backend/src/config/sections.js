// Section Configuration
// Currently set to 1 section as requested.
// To add more sections in the future, simply add them to this array (e.g., ['CSE-A', 'CSE-B', 'ECE-A']).
const ACTIVE_SECTIONS = ['CSE-A'];

module.exports = {
  ACTIVE_SECTIONS,
  DEFAULT_SECTION: ACTIVE_SECTIONS[0] || 'CSE-A',
};
