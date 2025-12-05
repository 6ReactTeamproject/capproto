// 회원가입 페이지
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authApi, setToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n/context";

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

// 국가 목록 (다국어 지원)
const getCountries = (t: (key: string) => string) => [
  { code: "KR", name: t("common.country.kr") },
  { code: "US", name: t("common.country.us") },
  { code: "JP", name: t("common.country.jp") },
];

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    nickname: "",
    role: "DEVELOPER",
    techStacks: [] as string[],
    country: "",
    portfolioLinks: [] as string[],
    experience: [] as Array<{
      title: string;
      role: string;
      period: string;
      description: string;
    }>,
  });
  const [newPortfolioLink, setNewPortfolioLink] = useState("");
  const [newExperience, setNewExperience] = useState({
    title: "",
    role: "",
    period: "",
    description: "",
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
      setError(err.message || t("auth.registerError"));
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
            <h1 className="text-3xl font-bold text-gray-900">
              {t("auth.register")}
            </h1>
            <p className="text-gray-600 mt-2">{t("auth.newAccount")}</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("auth.email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t("auth.email")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("auth.password")}
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
                placeholder={`${t("auth.password")} (${t(
                  "common.minLength"
                )} 6)`}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("auth.nickname")}
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
                placeholder={t("auth.nickname")}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("auth.role")}
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="DEVELOPER">{t("role.developer")}</option>
                <option value="DESIGNER">{t("role.designer")}</option>
                <option value="PLANNER">{t("role.planner")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t("auth.country")}
              </label>
              <select
                value={formData.country}
                onChange={(e) =>
                  setFormData({ ...formData, country: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t("auth.selectCountry")}</option>
                {getCountries(t).map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
            </div>
            {/* 기술 스택 (개발자용) */}
            {formData.role === "DEVELOPER" && (
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
            )}

            {/* 포트폴리오 링크 (디자이너/기획자용) */}
            {(formData.role === "DESIGNER" || formData.role === "PLANNER") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {formData.role === "DESIGNER"
                    ? t("auth.portfolioLinksDesigner")
                    : t("auth.portfolioLinksPlanner")}
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={newPortfolioLink}
                    onChange={(e) => setNewPortfolioLink(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && newPortfolioLink.trim()) {
                        e.preventDefault();
                        setFormData({
                          ...formData,
                          portfolioLinks: [
                            ...formData.portfolioLinks,
                            newPortfolioLink.trim(),
                          ],
                        });
                        setNewPortfolioLink("");
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPortfolioLink.trim()) {
                        setFormData({
                          ...formData,
                          portfolioLinks: [
                            ...formData.portfolioLinks,
                            newPortfolioLink.trim(),
                          ],
                        });
                        setNewPortfolioLink("");
                      }
                    }}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {t("auth.addLink")}
                  </button>
                </div>
                {formData.portfolioLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.portfolioLinks.map((link, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                      >
                        <a
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {link.length > 40
                            ? `${link.substring(0, 40)}...`
                            : link}
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              portfolioLinks: formData.portfolioLinks.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 기술 스택 (디자이너/기획자용 - 도구 경험) */}
            {(formData.role === "DESIGNER" || formData.role === "PLANNER") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {formData.role === "DESIGNER"
                    ? t("mypage.designTools")
                    : t("mypage.planningTools")}
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
            )}

            {/* 프로젝트 경험 (디자이너/기획자용) */}
            {(formData.role === "DESIGNER" || formData.role === "PLANNER") && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  {t("auth.experience")}
                </label>
                <div className="space-y-3 mb-3 p-4 border border-gray-300 rounded-xl bg-gray-50">
                  <input
                    type="text"
                    value={newExperience.title}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        title: e.target.value,
                      })
                    }
                    placeholder={t("auth.projectName")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newExperience.role}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        role: e.target.value,
                      })
                    }
                    placeholder={t("auth.projectRole")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    value={newExperience.period}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        period: e.target.value,
                      })
                    }
                    placeholder={t("auth.period")}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <textarea
                    value={newExperience.description}
                    onChange={(e) =>
                      setNewExperience({
                        ...newExperience,
                        description: e.target.value,
                      })
                    }
                    placeholder={t("auth.description")}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newExperience.title.trim()) {
                        setFormData({
                          ...formData,
                          experience: [
                            ...formData.experience,
                            { ...newExperience },
                          ],
                        });
                        setNewExperience({
                          title: "",
                          role: "",
                          period: "",
                          description: "",
                        });
                      }
                    }}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {t("auth.addExperience")}
                  </button>
                </div>
                {formData.experience.length > 0 && (
                  <div className="space-y-2">
                    {formData.experience.map((exp, index) => (
                      <div
                        key={index}
                        className="p-3 bg-white border border-gray-200 rounded-xl flex justify-between items-start"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {exp.title}
                          </div>
                          <div className="text-sm text-gray-600">
                            {exp.role} · {exp.period}
                          </div>
                          {exp.description && (
                            <div className="text-sm text-gray-500 mt-1">
                              {exp.description}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              experience: formData.experience.filter(
                                (_, i) => i !== index
                              ),
                            });
                          }}
                          className="text-red-600 hover:text-red-700 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
              {loading ? t("auth.registering") : t("auth.registerButton")}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {t("auth.goToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
