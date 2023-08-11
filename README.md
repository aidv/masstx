# Mass-TX - The best file transfer tool for the people


## 🌱 Simple
- Send folders
- No tunnels needed
- Better than FTP

## 🚀 Fast
- Sends multiple files at once
- Utilizes full network speed capacity

## Safe
- No need to expose your network to the public
- Can transfer both to or from target machine

## Description
Mass TX, or MTX for short, is the best file transfer tool for ML/AI engineers, IT people, developers, and anyone who needs to transfer large amounts of data from one machine to another.

When people need to transfer large amounts of data, they typically use FTP, rsync, or other solutions which can be annoying and quite frankly hard to configure. MTX aims to eliminate all headaches and simply work!

Simply start MTX in Server Mode on the publically exposed machine, e.g an AWS VM, and then start MTX in Client Mode on your local machine, and done!

# Docs
Getting started is easy! Download MTX on the two machines that will be sending and receiving data.
One machine must be exposed to the internet, e.g an AWS VM. This would be our "public machine".

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
