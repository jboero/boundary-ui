const process = require('process');

const spawnedSessions = [];

const purge = (process_id, index, deleteAfterPurge = true) => {
  console.debug('[session][purge]', process_id);
  process.kill(process_id);
  // Remove tracking after cancellation
  if (deleteAfterPurge) spawnedSessions.splice(index, 1);
};

module.exports = {
  /**
   * Track session spawned process and it's details.
   * This function is intended to tracked launched local proxy.
   * @param {object} params
   */
  add: ({ childProcess, data }) => {
    spawnedSessions.push({
      data,
      process_id: childProcess.pid,
    });
    console.debug('[session][add]', childProcess.pid);
  },
  /**
   * Cancel spawned child process using session, if available.
   * This function is intended to cancel launched local proxy.
   * @param {string} session_id
   */
  cancelSession: (session_id) => {
    spawnedSessions.find((value, index) => {
      const { process_id, data } = value;
      if (data.session_id === session_id) purge(process_id, index);
    });
  },
  /**
   * Cancel spawned child process, if available.
   * This function is intended to cancel launched local proxy.
   * @param {string} process_id
   */
  cancelProcess: (process_id) => {
    spawnedSessions.find((value, index) => {
      if (value.process_id === process_id) purge(process_id, index);
    });
  },
  /**
   * Close all spawned child processes.
   * This function is intended to use for closing all launched local proxies.
   */
  closeAll: () => {
    spawnedSessions.forEach((value, index) => {
      purge(value.process_id, index, false);
    });
  },
  /**
   * Checks for existence of spawned sessions.
   * @return {boolean}
   */
  hasEntries: () => {
    return spawnedSessions.length > 0;
  },
};
