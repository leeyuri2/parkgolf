import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCourses()
  }, [])

  async function fetchCourses() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          rules (*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      setCourses(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function addCourse(courseData, ruleData) {
    try {
      // 경기장 추가
      const { data: course, error: courseError } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single()

      if (courseError) throw courseError

      // 규칙 추가
      const { error: ruleError } = await supabase
        .from('rules')
        .insert({ ...ruleData, course_id: course.id })

      if (ruleError) throw ruleError

      await fetchCourses()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function updateCourse(courseId, courseData, ruleData) {
    try {
      const { error: courseError } = await supabase
        .from('courses')
        .update(courseData)
        .eq('id', courseId)

      if (courseError) throw courseError

      if (ruleData) {
        const { error: ruleError } = await supabase
          .from('rules')
          .update(ruleData)
          .eq('course_id', courseId)

        if (ruleError) throw ruleError
      }

      await fetchCourses()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  async function deleteCourse(courseId) {
    try {
      const { error } = await supabase
        .from('courses')
        .update({ is_active: false })
        .eq('id', courseId)

      if (error) throw error
      await fetchCourses()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  return {
    courses,
    loading,
    error,
    fetchCourses,
    addCourse,
    updateCourse,
    deleteCourse,
  }
}