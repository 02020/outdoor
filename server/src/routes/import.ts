import { Router } from 'express'
import multer from 'multer'
import { authGuard, adminOnly } from '../middleware/auth'
import { importFromExcel } from '../services/import'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

export const importRouter = Router()

importRouter.use(authGuard)

/** POST /api/import/excel - 导入 Excel 数据 */
importRouter.post('/excel', adminOnly, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传文件' })
    }

    const groupId = req.auth!.groupId
    const result = importFromExcel(groupId, req.file.buffer)

    res.json({
      message: '导入完成',
      ...result,
    })
  } catch (err) {
    next(err)
  }
})
