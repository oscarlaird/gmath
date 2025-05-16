import { supabase } from '../supabaseClient.js';

export const logResponseToSupabase = async (responseData) => {
  try {
    const { data, error } = await supabase
      .from('hw_responses')
      .insert([responseData]);
    
    if (error) {
      console.error('Error logging response to Supabase:', error);
      return false;
    }
    
    console.log('Response logged successfully:', data);
    return true;
  } catch (err) {
    console.error('Exception when logging to Supabase:', err);
    return false;
  }
}; 