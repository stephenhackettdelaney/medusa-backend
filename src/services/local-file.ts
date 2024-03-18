import { AbstractFileService } from "@medusajs/medusa"
import {
    DeleteFileType,
    FileServiceGetUploadStreamResult,
    FileServiceUploadResult,
    GetUploadedFileType,
    UploadStreamDescriptorType,
} from "@medusajs/types"

import * as fs from "fs"
import { Stream } from "stream"

class LocalFileService extends AbstractFileService {

    protected serverUrl = "http://localhost:9000"
    protected publicPath = "uploads"
    protected protectedPath = "protected-uploads"
    // protected protectedPath = "uploads" // think I need to add a hosting system for downloadable file ??

    constructor() {
        // @ts-ignore
        super(...arguments)

        // for public uploads
        if (!fs.existsSync(this.publicPath)) {
            fs.mkdirSync(this.publicPath)
        }

        // for protected uploads
        if (!fs.existsSync(this.protectedPath)) {
            fs.mkdirSync(this.protectedPath)
        }
    }

    async upload(
        fileData: Express.Multer.File
    ): Promise<FileServiceUploadResult> {
        const filePath =
            `${this.publicPath}/${fileData.originalname}`
        fs.copyFileSync(fileData.path, filePath)
        return {
            url: `${this.serverUrl}/${filePath}`,
            key: filePath,
        }
    }

    async uploadProtected(
        fileData: Express.Multer.File
    ): Promise<FileServiceUploadResult> {
        const filePath =
            `${this.protectedPath}/${fileData.originalname}`
        console.log("in uploadProtected ", filePath)
        fs.copyFileSync(fileData.path, filePath)
        return {
            url: `${this.serverUrl}/${filePath}`,
            key: filePath
        }
    }

    async delete(
        fileData: DeleteFileType
    ): Promise<void> {
        fs.rmSync(fileData.fileKey)
    }

    async getUploadStreamDescriptor({
        name,
        ext,
        isPrivate = true,
    }: UploadStreamDescriptorType
    ): Promise<FileServiceGetUploadStreamResult> {
        const filePath = `${isPrivate ?
            this.publicPath : this.protectedPath
            }/${name}.${ext}`

        const pass = new Stream.PassThrough()
        const writeStream = fs.createWriteStream(filePath)

        pass.pipe(writeStream)

        return {
            writeStream: pass,
            promise: Promise.resolve(),
            url: `${this.serverUrl}/${filePath}`,
            fileKey: filePath,
        }
    }

    async getDownloadStream({
        fileKey,
        isPrivate = true,
    }: GetUploadedFileType
    ): Promise<NodeJS.ReadableStream> {
        const filePath = `${isPrivate ?
            this.publicPath : this.protectedPath
            }/${fileKey}`
        const readStream = fs.createReadStream(filePath)

        return readStream
    }

    async getPresignedDownloadUrl({
        fileKey,
        isPrivate = true,
    }: GetUploadedFileType
    ): Promise<string> {
        // Local upload doesn't provide
        // support for presigned URLs,
        // so just return the file's URL.

        const filePath = `${isPrivate ?
            this.publicPath : this.protectedPath
            }/${fileKey}`
        return `${this.serverUrl}/${filePath}`
    }
}

export default LocalFileService