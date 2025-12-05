// 회원가입 페이지
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, setToken } from "@/lib/api";

// 사용 가능한 기술 스택 목록
const AVAILABLE_TECH_STACKS = [
  // Frontend
  "React",
  "Vue.js",
  "Next.js",
  "Angular",
  "TypeScript",
  "JavaScript",
  "HTML/CSS",
  // Backend
  "Node.js",
  "NestJS",
  "Express",
  "Spring",
  "Django",
  "FastAPI",
  "Python",
  "Java",
  // Database
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  // Mobile
  "React Native",
  "Flutter",
  "Swift",
  "Kotlin",
  // Design
  "Figma",
  "Photoshop",
  "Illustrator",
  "Sketch",
  "Adobe XD",
  // Tools
  "Docker",
  "Git",
  "Kubernetes",
  "AWS",
  "Firebase",
  "Prisma",
  "TypeORM",
];

// 국가 목록
const COUNTRIES = [
  { code: "KR", name: "대한민국" },
  { code: "US", name: "미국" },
  { code: "JP", name: "일본" },
];

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    role: "DEVELOPER",
    techStacks: [] as string[],
    country: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await authApi.register(formData);
      setToken(response.accessToken);
      router.push("/projects");
    } catch (err: any) {
      setError(err.message || "회원가입에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">회원가입</h1>
            <p className="text-gray-600 mt-2">새로운 계정을 만들어보세요</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="이메일을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="비밀번호를 입력하세요 (최소 6자)"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                닉네임
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                required
                minLength={2}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="닉네임을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                역할
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DEVELOPER">개발자</option>
                <option value="DESIGNER">디자이너</option>
                <option value="PLANNER">기획자</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                국가
              </label>
              <select
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">국가를 선택하세요</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                기술 스택 (복수 선택 가능)
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-xl p-4 space-y-2">
                {AVAILABLE_TECH_STACKS.map((stack) => (
                  <label
                    key={stack}
                    className="flex items-center cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.techStacks.includes(stack)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            techStacks: [...formData.techStacks, stack],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            techStacks: formData.techStacks.filter(
                              (s) => s !== stack
                            ),
                          });
                        }
                      }}
                      className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{stack}</span>
                  </label>
                ))}
              </div>
              {formData.techStacks.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.techStacks.map((stack) => (
                    <span
                      key={stack}
                      className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {stack}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-medium">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-300 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-0.5 disabled:transform-none"
            >
              {loading ? "가입 중..." : "회원가입"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              로그인
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
