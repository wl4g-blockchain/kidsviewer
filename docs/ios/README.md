# iOS开发文档

本目录包含iOS应用开发和分发的完整指南。

## 文件说明

### IOS_DISTRIBUTION_COMPLETE_GUIDE.md
**iOS开发者分发完整指南（中文版）** - 这是最重要的文档，包含：

- 三种分发类型的详细对比表格（个人开发者、企业开发者、免费Apple ID）
- 价格、限制、优势分析
- 从注册到生成IPA的完整步骤
- 设备注册和UDID获取方法
- 故障排除和最佳实践

### IOS_DISTRIBUTION_COMPLETE_GUIDE_EN.md
**iOS Developer Distribution Complete Guide (English Version)** - 包含与中文版相同的内容：

- Detailed comparison table of three distribution types
- Price, limitations, and advantages analysis
- Complete steps from registration to IPA generation
- Device registration and UDID acquisition methods
- Troubleshooting and best practices

### install-to-family-device.sh
**家人设备安装脚本** - 自动化脚本，帮助：
- 检测连接的iOS设备
- 自动构建项目
- 提供安装指导

## 快速开始

1. **阅读完整指南**：先查看 `IOS_DISTRIBUTION_COMPLETE_GUIDE.md`（中文）或 `IOS_DISTRIBUTION_COMPLETE_GUIDE_EN.md`（英文）
2. **选择分发方式**：根据需求选择个人开发者、企业开发者或免费Apple ID
3. **注册设备**：获取UDID并注册到开发者账号
4. **构建应用**：使用Xcode或运行 `install-to-family-device.sh`

## 分发方式选择建议

| 使用场景 | 推荐方式 | 年费 | 设备限制 |
|---------|---------|------|---------|
| 学习测试 | 免费Apple ID | 免费 | 3个设备 |
| 个人开发 | 个人开发者账号 | $99 | 无限制 |
| 企业内部分发 | 企业开发者账号 | $299 | 无限制 |

## 重要提醒

- 企业分发仅限内部员工使用
- 免费账号有严格的设备限制
- 所有分发方式都需要遵守Apple的开发者协议
- 定期检查证书和配置文件的有效期

## 获取帮助

如果遇到问题，请参考相应语言版本的 `IOS_DISTRIBUTION_COMPLETE_GUIDE.md` 中的故障排除部分。

## 文档格式说明

所有markdown文档都遵循标准格式：
- 标题下有空行分隔
- 代码块使用正确的语法高亮
- 表格格式规范
- 链接和引用格式正确
