"""验证Java编译器选择和版本围栏；不下载工具或生成合同。"""
import importlib.util
import os
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch


# MODULE仅装载生成器函数，单测不进入其main生成入口。
SPEC = importlib.util.spec_from_file_location("java_generator", Path(__file__).with_name("generate_java_pb.py"))
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class JavaCompilerTest(unittest.TestCase):
    """覆盖显式/默认编译器、缺工具和不安全旧版本的确定性拒绝。"""

    def test_explicit_compiler(self):
        """显式Java路径不替换系统Go编译器，且核实际程序版本。"""
        with patch.dict(os.environ, {"UR_KIT_JAVA_PROTOC": "/fixture/protoc"}), patch.object(MODULE.shutil, "which", return_value="/fixture/protoc") as find, patch.object(MODULE.subprocess, "check_output", return_value="libprotoc 25.6\n") as version:
            self.assertEqual(MODULE.java_protoc(), "/fixture/protoc")
            find.assert_called_once_with("/fixture/protoc")
            version.assert_called_once_with(["/fixture/protoc", "--version"], text=True)

    def test_default_compiler(self):
        """没有覆盖时仍允许PATH中的匹配版本。"""
        with patch.dict(os.environ, {}, clear=True), patch.object(MODULE.shutil, "which", return_value="/fixture/protoc") as find, patch.object(MODULE.subprocess, "check_output", return_value="libprotoc 25.6"):
            self.assertEqual(MODULE.java_protoc(), "/fixture/protoc")
            find.assert_called_once_with("protoc")

    def test_old_or_unpinned_version_rejected(self):
        """旧版本及未经验证的新版本均在下载插件/改写输出前拒绝。"""
        for value in ["libprotoc 3.21.12", "libprotoc 25.5", "libprotoc 26.0", ""]:
            with self.subTest(value=value), patch.object(MODULE.shutil, "which", return_value="/fixture/protoc"), patch.object(MODULE.subprocess, "check_output", return_value=value), patch.object(MODULE, "grpc_plugin") as plugin:
                with self.assertRaises(SystemExit):
                    MODULE.main()
                plugin.assert_not_called()

    def test_missing_compiler_rejected(self):
        """缺失编译器不能继续调用任意工具或覆盖旧生成物。"""
        with patch.object(MODULE.shutil, "which", return_value=None), patch.object(MODULE.subprocess, "check_output") as version:
            with self.assertRaises(SystemExit):
                MODULE.java_protoc()
            version.assert_not_called()

    def test_missing_include_preserves_output(self):
        """缺标准定义时在下载插件及改写旧产物前失败。"""
        with tempfile.TemporaryDirectory() as directory, patch.dict(os.environ, {"UR_KIT_JAVA_PROTOC_INCLUDE": directory}), patch.object(MODULE, "java_protoc", return_value="/fixture/protoc"), patch.object(MODULE, "grpc_plugin") as plugin:
            with self.assertRaises(SystemExit):
                MODULE.main()
            plugin.assert_not_called()

    def test_explicit_and_default_include(self):
        """匹配摘要的显式目录与发行包默认目录均可用，污染内容拒绝。"""
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "include/google/protobuf/wrappers.proto"
            source.parent.mkdir(parents=True)
            source.write_bytes(b"fixture")
            expected = MODULE.hashlib.sha256(b"fixture").hexdigest()
            with patch.object(MODULE, "WELL_KNOWN_HASHES", {"google/protobuf/wrappers.proto": expected}):
                with patch.dict(os.environ, {}, clear=True):
                    self.assertEqual(MODULE.java_include(str(root / "bin/protoc")), root / "include")
                with patch.dict(os.environ, {"UR_KIT_JAVA_PROTOC_INCLUDE": str(root / "include")}):
                    self.assertEqual(MODULE.java_include("/other/protoc"), root / "include")
                    source.write_bytes(b"wrong-version")
                    with self.assertRaises(SystemExit):
                        MODULE.java_include("/other/protoc")


if __name__ == "__main__":
    unittest.main()
