'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { MarkerInfo } from '@/types';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  markers: MarkerInfo[];
}

export default function CourseModal({
  isOpen,
  onClose,
  markers
}: CourseModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '산책'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('코스 저장!', formData);
    onClose();
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      category: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="z-[9999]" />
        <DialogContent className=" z-[9999] bg-white ">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <span className="text-2xl">🚶‍♂️</span>
              코스 저장
            </DialogTitle>
            <DialogDescription>
              새로운 산책 코스를 저장하세요. 현재{' '}
              <span className="font-semibold text-blue-600">
                {markers.length}개
              </span>
              의 지점이 선택되어 있습니다.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  코스 제목
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="예: 한강공원 산책 코스"
                  className="h-11 max-w-md"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  코스 설명
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="이 코스에 대한 자세한 설명을 입력해주세요..."
                  rows={3}
                  className="resize-none max-w-md"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  카테고리
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="산책">🚶‍♂️ 산책</SelectItem>
                    <SelectItem value="러닝">🏃‍♂️ 러닝</SelectItem>
                    <SelectItem value="맛집">🍽️ 맛집</SelectItem>
                    <SelectItem value="여행">✈️ 여행</SelectItem>
                    <SelectItem value="관광">🏛️ 관광</SelectItem>
                    <SelectItem value="쇼핑">🛍️ 쇼핑</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 마커 정보 미리보기 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  코스 경로 ({markers.length}개 지점)
                </Label>
                <div className="bg-muted/50 rounded-lg p-4 max-h-32 overflow-y-auto border">
                  {markers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      지도에서 지점을 클릭하여 경로를 만들어보세요
                    </p>
                  ) : (
                    <div className="space-y- max-w-md">
                      {markers.map((marker, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 py-1">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-sm text-foreground ">
                            {marker.address}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                취소
              </Button>
              <Button
                className="bg-blue-600 text-white"
                type="submit"
                disabled={markers.length === 0}>
                저장
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
