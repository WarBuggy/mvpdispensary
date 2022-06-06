const dbConfig = require('./config.js');
const common = require('../common.js');
const mysql = require('mysql');

let connection = null;

module.exports = {
    query: function (logInfo, params) {
        logQueryToConsole(logInfo, params);
        return new Promise(function (resolve) {
            module.exports.getConnection()
                .then(function (connection) {
                    let sql = logInfo.sql;
                    if (params) {
                        sql = mysql.format(sql, params);
                    }
                    connection.query(sql, async function (queryError, selectResult, fields) {
                        if (queryError) {
                            let consoleMessage = `Result code 901. Error while executing a query from database:\n${queryError}`;
                            await logActionToDB(logInfo, consoleMessage, params);
                            resolve({ resultCode: 901, });
                            return;
                        }
                        await logActionToDB(logInfo, 'Result OK', params);
                        let result = {
                            sqlResults: selectResult,
                            fields: fields,
                            resultCode: 0,
                        };
                        resolve(result);
                    });
                });
        });
    },

    getConnection: function () {
        return new Promise(function (resolve) {
            if (connection == null) {
                createConnection()
                    .then(function (result) {
                        connection = result;
                        resolve(result);
                    });
            } else {
                resolve(connection);
            }
        });
    },

    closeConnection: function () {
        if (connection == null) {
            common.consoleLog('Database connection does not exist.');
            return;
        }
        return new Promise(function (resolve) {
            try {
                connection.end();
                common.consoleLog('Database connection was closed successfully.');
                resolve();
            } catch (closingError) {
                common.consoleLogError(`Error while closing database connection:\n${closingError}.`);
                connection.destroy();
                resolve();
            }
        });
    },
};

function logQueryToConsole(logInfo, params) {
    if (dbConfig.logLogInfo === true) {
        console.log('Log Info:');
        console.log(logInfo);
    }
    if (dbConfig.logParams === true) {
        console.log('Params:');
        console.log(params || 'No param provided.');
    }
};

function createConnection() {
    return new Promise(function (resolve) {
        let aConnection = mysql.createConnection({
            host: dbConfig.host,
            user: dbConfig.user,
            password: dbConfig.password,
            database: dbConfig.initDB,
            port: dbConfig.port,
        });
        aConnection.connect(function (connectionError) {
            if (connectionError) {
                common.consoleLogError(`Error while connecting to database:\n${connectionError}.`);
                resolve(null);
                return;
            }
            common.consoleLog(`Database connected with id ${aConnection.threadId}.`);
            resolve(aConnection);
        });
    });
};

function logActionToDB(logInfo, result, params) {
    return new Promise(function (resolve) {
        module.exports.getConnection()
            .then(function (connection) {
                let sql = `INSERT INTO \`mvpdispensary_system\`.\`log_action\` 
                    (\`user\`, \`sql\`, \`ip\`, \`purpose\`, \`result\`, \`param\`) 
                    VALUES (?, ?, ?, ?, ?, ?)`;
                let paramString = (params || []).join(',');
                let logErrorParams = [logInfo.username, logInfo.sql, logInfo.userIP, logInfo.purpose, result, paramString];
                let formatQuery = mysql.format(sql, logErrorParams);
                connection.query(formatQuery, function (logError) {
                    if (logError) {
                        common.consoleLogError(`${logInfo.userIP} ${logInfo.purpose}. ${result}.\nFailed to log error to database. Log error:\n${logError}.`);
                        resolve(false);
                        return;
                    }
                    common.consoleLog(`${logInfo.userIP} ${logInfo.purpose}. ${result}. Action logged.`);
                    resolve(true);
                });
            });
    });
};