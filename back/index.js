const { ApolloServer, gql } = require('apollo-server');
const AWS = require('aws-sdk')
const fs = require('fs')
const moment = require('moment')
const dotenv = require('dotenv');

dotenv.config();

AWS.config.update({
    region: 'ap-northeast-2',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });

const s3 = new AWS.S3({apiVersion: '2012-10-17'});

const typeDefs = gql`  
  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }
  
  type Query {
    _ : Boolean
  }
  
  type Mutation {
    singleUpload(file: Upload!): File!,
    singleUploadStream(file: Upload!): File!
  }
`;

const resolvers = {
  Mutation: {
    singleUpload: (parent, args) => {
      return args.file.then(file => {
        const {createReadStream, filename, mimetype} = file
        const fileStream = createReadStream()
        console.log(filename);
        
        fileStream.pipe(fs.createWriteStream(`./uploadedFiles/${filename}`))
        return file;
      });
    },
    singleUploadStream: async (parent, args) => {
      const file = await args.file
      const {createReadStream, filename, mimetype} = file
      const fileStream = createReadStream()

      const Date = moment().format('YYYYMMDD');
      const uploadParams = {Bucket: 'title-academy', Key: `post/${Date}${filename}`, Body: fileStream,ContentType:mimetype};
      const result = await s3.upload(uploadParams).promise()
      console.log(result)
      return file;
    }
  },
};
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`\`🚀  Server ready at ${url}`);
});