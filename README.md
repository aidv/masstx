# Mass-TX - The best file transfer tool for the people

Precompiled
Windows + MacOS + Linux: https://splitter.ai/vanillaFE/resources/mtx_0.29.zip

## 🌱 Simple
- Send folders
- No tunnels needed
- Better than FTP

## 🚀 Fast
- Sends multiple files at once
- Utilizes full network speed capacity

## 🔒 Safe
- No need to expose your network to the public
- Can transfer both to or from target machine


## Description
Mass TX, or MTX for short, is the best file transfer tool for ML/AI engineers, IT people, developers, and anyone who needs to transfer large amounts of data from one machine to another.

When people need to transfer large amounts of data, they typically use FTP, rsync, or other solutions which can be annoying and quite frankly hard to configure. MTX aims to eliminate all headaches and simply work!

Simply start MTX in Server Mode on the publically exposed machine, e.g an AWS VM, and then start MTX in Client Mode on your local machine, and done!

# Docs
Getting started is easy! Download MTX on the two machines that will be sending and receiving data.
One machine must be exposed to the internet, e.g an AWS VM. This would be our "public machine".

### Arguments

.option('-p, --port <number>', 'Port. Default 5487', 5487)
    .option('-s, --asServer', 'Start as a server, rather than a client.')
    .option('-t, --target <type>', 'That server to connect to')
    
    .option('-i, --inputPath <type>', 'The path to send to target')
    .option('-o, --outputPath <type>', 'The target path where to store the files')
    .option('-f, --forceRemote', 'For debug purposes')
    .option('-w, --workers <number>', 'How many concurrent upload streams to allow. Default is 20. More is not necessarily better.', 20)
    .option('-c, --tempFolder <type>', 'Temporary folder path')
    .option('-v, --validate', 'Validate local and remote files using CRC checksum')



| Argument | Description    | Usage    |
| :---:   | :---: | :---: |
| -d | Debug / Verbose. Prints info while operating    | ./mtx -d   |
| -s | Server mode. Start MTX as a server.    | ./mtx -s   |
| -t | Target. Defines the remote server to connect to.    | ./mtx -t 192.168.1.2   |
| -i | Input path. Defines which folder to send.    | ./mtx -i <path to folder>   |
| -o | Output path. Defines which folder to store the data in.    | ./mtx -o <path to target folder>   |
| -w | Worker count. Default is 20. Defines how many transfer workers to use. Depending on the network speed this number can be lower or higher. 20 is usually fine.  | ./mtx -w 5   |
| -c | Temporary folder path. Defines the path where to temporarily store the incoming data for the running MTX session. Use this when running multiple instances of MTX.    | ./mtx -c <path to temporary folder>   |
| -v | Validate data only. Tells both server and client to only validate data, and not to do any actual data transfer.    | ./mtx -v   |

### 🌍 Starting the server
On the publicly exposed machine, e.g your AWS VM, run MTX using the following command:

`mtx -s -o /receivedFilesHere/`

You can set which port to listen to with the `-p` argument:

`mtx -s -p 1234 -o /receivedFilesHere/`

You can set where temporary folder should be located with the `-c` argument:

`mtx -s -p 1234 -c /myTmpFolder -o /receivedFilesHere/`

### 🖥 👉 🌍 Upload from Local to Remote
On the local machine, set the input path as a Local path on your Local machine, and the output path as a Remote path on your Remote machine:

`mtx -t 192.168.1.2 -i c:\localFolderToSend\`

Once transfer is complete, you can validate the data by using the `-v` argument:

`mtx -t 192.168.1.2 -v -i c:\localFolderToSend\`


### 🖥 👈 🌍 Download from Remote to Local
If you'd like to transfer data from the remote machine to the local machine:

`mtx -t 192.168.1.2 -i ~/remoteFolderToSend/ -o c:\localFolderToStoreInside\`
